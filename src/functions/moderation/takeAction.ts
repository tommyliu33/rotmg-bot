import { logger } from '../../util/logger';
import { ModLogAction, type ModLogCase } from './createCase';

export async function takeAction(case_: ModLogCase) {
	const { moderator, target, reason } = case_;
	const { guild } = moderator;

	try {
		switch (case_.action) {
			case ModLogAction.Ban:
			case ModLogAction.Unban:
				await target.ban({ reason, deleteMessageDays: 7 });
				if (case_.action === ModLogAction.Unban) {
					await guild.members.unban(target.user.id);
				}
				break;
			case ModLogAction.Kick:
				await target.kick(reason);
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
