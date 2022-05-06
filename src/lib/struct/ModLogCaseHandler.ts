import type { Client, GuildMember } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kClient, kDatabase } from '../../tokens';
import type { Database } from './Database';

export enum ModLogAction {
	Ban = 'Ban',
	Unban = 'Unban',

	Kick = 'Kick',

	Mute = 'Mute',
	Unmute = 'Unmute',

	Suspend = 'Suspend',
	Unsuspend = 'Unsuspend',

	Warn = 'Warn',
}

@injectable()
export class ModLogCaseHandler {
	public constructor(
		@inject(kClient) private readonly client: Client,
		@inject(kDatabase) private readonly db: Database
	) {}

	public async create(case_: ModLogCase) {
		const { target, action, reason, moderator } = case_;
		const { guild } = moderator;

		console.log(case_);

		await this.takeAction(case_);
	}

	private async takeAction(case_: ModLogCase) {
		const { moderator, target, reason } = case_;
		const { guild } = moderator;

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
	}
}

export interface ModLogCase {
	moderator: GuildMember;
	target: GuildMember;

	action: ModLogAction;
	reason: string;

	duration?: number;
	silent?: boolean;
}

export interface RawModLogCase {
	moderator_id: string;
	target_id: string;

	action: string;
	reason: string;

	duration?: number;
}
