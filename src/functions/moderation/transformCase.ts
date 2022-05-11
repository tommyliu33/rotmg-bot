import type { GuildsModerationCases } from '@prisma/client';
import type { ModLogCase } from './createCase';

export function transformCase(case_: ModLogCase & { id: string }): GuildsModerationCases {
	return {
		action: case_.action,
		moderatorId: case_.moderator.id,
		targetId: case_.target.id,
		actionProcessed: false,
		duration: case_.duration ?? 0,
		roles: case_.roles ?? [],
		id: case_.id,
		reason: case_.reason ?? '',
	};
}
