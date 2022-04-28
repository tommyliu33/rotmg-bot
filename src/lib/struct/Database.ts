import Prisma, { GuildsMainRaiding, GuildsVeteranRaiding } from '@prisma/client';

import type { Client } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kClient } from '../../tokens';

import { logger } from '../../util/logger';

const { PrismaClient } = Prisma;

@injectable()
export class Database {
	private readonly prismaClient: Prisma.PrismaClient | undefined;
	public constructor(@inject(kClient) private readonly client: Client) {}

	public get guilds() {
		if (this.prismaClient) return this.prismaClient.guilds;
		return null;
	}

	public async start() {
		if (this.prismaClient) return this.prismaClient;

		const prismaClient = new PrismaClient();
		await prismaClient.$connect();

		Object.defineProperty(this, 'prismaClient', { value: prismaClient });

		logger.info('Connected to mongo');
	}

	public async getSection<T extends SectionType>(
		guildId: string,
		section: T
	): Promise<T extends 'main' ? GuildsMainRaiding : GuildsVeteranRaiding> {
		const doc = await this.guilds?.findFirst({ where: { guildId } });

		const data = doc![section];
		if (section === 'main') {
			// @ts-expect-error
			return data as GuildsMainRaiding;
		}

		// @ts-expect-error
		return data as GuildsVeteranRaiding;
	}

	public async updateSection<
		T extends SectionType,
		K extends keyof (T extends 'main' ? GuildsMainRaiding : GuildsVeteranRaiding)
	>(guildId: string, section: T, key: K, value: unknown) {
		await this.guilds?.update({
			where: {
				guildId,
			},
			select: {
				[section]: true,
			},
			data: {
				[section]: {
					update: {
						[key]: value,
					},
				},
			},
		});

		return value;
	}

	public async getSections(guildId: string) {
		const doc = await this.guilds?.findFirst({ where: { guildId } });
		if (doc) return { main: doc.main, veteran: doc.veteran };

		return null;
	}
}

export type SectionType = 'main' | 'veteran';
