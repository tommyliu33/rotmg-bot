import type { Dungeon } from './RaidManager';
import type { Client, Guild } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient } from '../tokens';

@injectable()
export class Headcount implements IHeadcount {
	guildId!: string;
	guild!: Guild;
	memberId!: string;
	messageId!: string;
	textChannelId!: string;
	voiceChannelId!: string;
	dungeon!: Dungeon;

	public constructor(@inject(kClient) public readonly client: Client<true>) {}
}

export interface IHeadcount {
	guildId: string;

	memberId: string;
	messageId: string;

	textChannelId: string;
	voiceChannelId: string;

	dungeon: Dungeon;
}
