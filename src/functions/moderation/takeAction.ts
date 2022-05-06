import type { GuildMember } from 'discord.js';

import { logger } from '../../util/logger';
import { ModLogAction, type ModLogCase } from './createCase';

export async function takeAction(case_: ModLogCase) {
	const { moderator, target, reason, deleteMessageDays } = case_;
	const { guild } = moderator;

	try {
		switch (case_.action) {
			case ModLogAction.Ban:
				await (target as GuildMember).ban({ reason, deleteMessageDays });
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