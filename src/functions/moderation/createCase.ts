import type { GuildMember, User } from 'discord.js';
import { logCase } from './logCase';
import { takeAction } from './takeAction';

export enum ModLogAction {
	Ban,
	Unban,

	Kick,

	Mute,
	Unmute,

	Suspend,
	Unsuspend,

	Warn,
}

export async function createCase(case_: ModLogCase) {
	const { target, action, reason, moderator } = case_;
	const { guild } = moderator;

	console.log(case_);

	await takeAction(case_);
	await logCase(case_);
}

export interface ModLogCase {
	moderator: GuildMember;
	target: GuildMember | User;

	action: number;
	reason: string;

	duration?: number;
	silent?: boolean;

	deleteMessageDays?: number;
}
