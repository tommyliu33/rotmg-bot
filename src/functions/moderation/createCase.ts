import { nanoid } from 'nanoid';
import { logCase } from './logCase';
import { takeAction } from './takeAction';

import type { GuildMember, User } from 'discord.js';

export enum ModLogAction {
	Ban,
	Unban,

	Kick,

	Timeout,

	Suspend,
	Unsuspend,

	Warn,
}

export async function createCase(case_: ModLogCase & { id?: string }) {
	if (!case_.reason) {
		case_.reason = 'No reason provided';
	}

	if (!case_.id) {
		case_.id = nanoid(13);
	}

	await takeAction(case_);
	// suspensions should edit the log embed
	if (case_.action !== ModLogAction.Suspend)
		// @ts-expect-error
		await logCase(case_);
}

export interface ModLogCase {
	moderator: GuildMember;
	target: GuildMember | User;

	action: number;
	reason: string | null;

	roles?: string[];

	duration?: number;
	silent?: boolean;

	// whether this case has finished
	processed?: boolean;

	deleteMessageDays?: number;
}
