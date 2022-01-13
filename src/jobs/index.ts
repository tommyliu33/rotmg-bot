import type Bree from 'bree';
import type { Client } from 'discord.js';

import { container } from 'tsyringe';
import { kBree, kPrisma, kClient } from '../tokens';
import type Prisma from '@prisma/client';

import { logger } from '../logger';

import { getGuildSetting, transformCase, RawCase, createCase, CaseType } from '../functions';
import { Duration } from '@sapphire/time-utilities';

const bree = container.resolve<Bree>(kBree);
const prisma = container.resolve<Prisma.PrismaClient>(kPrisma);

interface JobPayload {
	type: number;
}

export function registerJobs() {
	bree.add({
		name: 'suspensions',
		interval: '5m',
		path: './jobs/suspensions.js',
	});
	logger.info('Registering jobs');
}

export function startJobs() {
	logger.info('Starting jobs');

	bree.on('worker created', (name) => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		bree.workers[name].on('message', async (message: JobPayload) => {
			const client = container.resolve<Client<true>>(kClient);

			switch (message.type) {
				case 0:
					const guilds = await prisma.guilds.findMany().catch(() => undefined);
					if (!guilds) return;

					for (const guild of guilds) {
						for (const case_ of guild.cases) {
							const transformedCase = transformCase(case_ as unknown as RawCase);
							if (transformedCase.action !== 0 || transformedCase.actionProcessed) continue;

							if (Date.now() >= Date.parse(transformedCase.date) + new Duration(transformedCase.duration).offset) {
								const guild = await client.guilds.fetch(transformedCase.guildId).catch(() => undefined);
								if (!guild) return;

								const member = await guild.members.fetch(transformedCase.userId).catch(() => undefined);
								if (!member) return;

								if (transformedCase.roles) {
									await member.roles.set(transformedCase.roles).catch(() => undefined);
								} else {
									const roleId = await getGuildSetting(transformedCase.guildId, 'SuspendRole');
									await member.roles.remove([roleId]).catch(() => undefined);
								}

								await createCase(transformedCase.guildId, {
									...transformedCase,
									action: CaseType.SuspensionEnd,
									actionProcessed: true,
								});

								logger.info(
									`Unsuspending ${member.user.tag} (${member.user.id}) in ${guild.name} (${guild.id}) after ${transformedCase.duration}`
								);
							}
						}
					}
					break;
			}
		});
	});

	bree.start();
}
