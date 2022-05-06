import type { GuildsModerationCases } from '@prisma/client';
import type { ModLogCase } from './createCase';

export function transformCase(case_: ModLogCase): GuildsModerationCases {
	return {
		action: case_.action,
		moderatorId: case_.moderator.id,
		targetId: case_.target.id,
	};
}
