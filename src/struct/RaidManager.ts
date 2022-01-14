import EventEmitter from '@tbnritzdoge/events';
import { Collection } from '@discordjs/collection';

import type { Client } from 'discord.js';
import type { DungeonMap } from '../dungeons';

import { inject, injectable } from 'tsyringe';
import { kClient, kRedis } from '../tokens';
import type { Redis } from 'ioredis';

@injectable()
export class RaidManager extends EventEmitter {
	public readonly headcounts: Collection<string, Headcount>;
	public readonly raids: Collection<string, Raid>;
	public readonly channels: Collection<string, Channel>;
	public constructor(
		@inject(kRedis) public readonly redis: Redis,
		@inject(kClient) public readonly client: Client<true>
	) {
		super();

		this.headcounts = new Collection();
		this.raids = new Collection();
		this.channels = new Collection();
	}
}

export interface RaidBase {
	dungeon: DungeonMap[keyof DungeonMap];
	guildId: string;
	channelId: string;
	leaderId: string;
	messageId: string;

	controlPanelChannelId: string;
	controlPanelMessageId: string;
}

export interface Raid extends RaidBase {
	location: string;
	voiceChannelId: string;
}

export interface Headcount extends Exclude<Raid, 'location'> {}

export interface Channel
	extends Omit<
		Raid,
		'dungeon' | 'reacts' | 'reacted' | 'reacts_' | 'controlPanelId' | 'controlPanelMessageId' | 'location'
	> {
	name: string;

	roleId: string;

	state: 'LOCKED' | 'CLOSED' | 'OPENED';
}
