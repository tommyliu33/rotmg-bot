import type { GuildMember } from 'discord.js';

import { logger } from '../../util/logger';
import { ModLogAction, type ModLogCase } from './createCase';

export async function takeAction(case_: ModLogCase) {
	const { moderator, target, deleteMessageDays } = case_;
	const reason = case_.reason!;
	const { guild } = moderator;

	try {
		switch (case_.action) {
			case ModLogAction.Ban:
				await moderator.guild.bans.create(target, { deleteMessageDays, reason });
				break;
			case ModLogAction.Unban:
				await guild.members.unban(target.id);
				break;
			case ModLogAction.Kick:
				await (target as GuildMember).kick(reason);
				break;
			case ModLogAction.Mute:
				break;
			case ModLogAction.Unmute:
				break;
			case ModLogAction.Suspend:
				break;
			case ModLogAction.Unsuspend:
				break;
			case ModLogAction.Warn:
				break;
		}
	} catch (e) {
		const error = e as Error;
		logger.error(error, error.message);
	}
}
