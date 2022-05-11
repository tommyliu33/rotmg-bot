import { logger } from '../../util/logger';
import { ModLogAction, type ModLogCase } from './createCase';

import { container } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type { Database } from '#struct/Database';

import type { GuildMember } from 'discord.js';

export async function takeAction(case_: ModLogCase) {
	const { moderator, target, deleteMessageDays } = case_;
	const { guild } = moderator;

	console.log(case_);

	try {
		switch (case_.action) {
			case ModLogAction.Ban:
				await guild.bans.create(target, { deleteMessageDays, reason: case_.reason! });
				break;
			case ModLogAction.Unban:
				await guild.members.unban(target.id);
				break;
			case ModLogAction.Kick:
				await guild.members.kick(target, case_.reason!);
				break;
			case ModLogAction.Suspend:
			case ModLogAction.Unsuspend:
				const db = container.resolve<Database>(kDatabase);
				const doc = await db.guilds?.findUnique({ where: { guildId: guild.id } });

				if (doc) {
					const member = target as GuildMember;
					const roles = member.roles.cache.filter((r) => r.id !== r.guild.id).map((r) => r.id);
					if (case_.action === ModLogAction.Suspend) {
						await member.roles.set([doc.moderation.suspendRoleId]);

						const cases_ = doc.moderation.cases;
						const storedCaseIndex = doc.moderation.cases.findIndex(
							(case_) => case_.action === ModLogAction.Suspend && !case_.actionProcessed && case_.targetId === target.id
						);
						if (storedCaseIndex !== -1) {
							// store user roles
							const storedCase = doc.moderation.cases[storedCaseIndex];
							storedCase.roles = roles;

							await db.guilds?.update({
								where: {
									guildId: guild.id,
								},
								data: {
									moderation: {
										update: {
											cases: cases_,
										},
									},
								},
							});
						}
					}

					if (case_.action === ModLogAction.Unsuspend) {
						const cases_ = doc.moderation.cases;
						const storedCaseIndex = doc.moderation.cases.findIndex(
							(case_) => case_.action === ModLogAction.Suspend && !case_.actionProcessed && case_.targetId === target.id
						);
						if (storedCaseIndex !== -1) {
							const storedCase = doc.moderation.cases[storedCaseIndex];
							storedCase.actionProcessed = true;

							cases_[storedCaseIndex] = storedCase;

							await db.guilds?.update({
								where: {
									guildId: guild.id,
								},
								data: {
									moderation: {
										update: {
											cases: cases_,
										},
									},
								},
							});

							await member.roles.set(storedCase.roles);
						}
					}
				}
				break;
			case ModLogAction.Warn:
				break;
			case ModLogAction.Timeout:
				await (target as GuildMember).timeout(case_.duration!);
				break;
		}
	} catch (e) {
		const error = e as Error;
		logger.error(error, error.message);
	}
}
