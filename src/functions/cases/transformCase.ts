import type { Case, CaseType } from '../';

export interface RawCase {
	action: CaseType;
	action_processed: boolean;

	guild_id: string;
	user_id: string;

	moderator_id: string;

	roles?: string[];
	reason: string;

	date: string;
	duration: string;

	log_channel_id: string;
}

export function transformCase(case_: RawCase): Case {
	return {
		action: case_.action,
		actionProcessed: case_.action_processed,

		guildId: case_.guild_id,
		userId: case_.user_id,
		moderatorId: case_.moderator_id,
		logChannelId: case_.log_channel_id,

		roles: case_.roles ?? [],
		reason: case_.reason,

		date: case_.date,
		duration: case_.duration,
	};
}
