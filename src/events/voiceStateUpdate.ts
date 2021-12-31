import type { Event } from '@struct';
import type { VoiceState } from 'discord.js';

import { inject, injectable } from 'tsyringe';
import type { Redis } from 'ioredis';
import { kRedis } from '../tokens';

import dayjs from 'dayjs';
import { inlineCode, time } from '@discordjs/builders';

@injectable()
export default class implements Event {
	public name = 'voiceStateUpdate';

	public constructor(@inject(kRedis) public readonly redis: Redis) {}

	public async execute(oldState: VoiceState, newState: VoiceState) {
		if (oldState.member?.user.bot) return;

		const { member } = oldState;
		const guildId = member?.guild.id as string;
		const memberId = member?.user.id as string;

		const key = `voiceState:${guildId}:${memberId}`;

		const cached = await this.redis.get(key);
		let logs: string[] = [];

		if (typeof cached === 'string') logs = cached.split('\n');

		const time_ = time(new Date(), 'T');

		if (!oldState.deaf && newState.deaf) {
			logs.push(`${time_} ${member?.user.tag as string} deafened in ${oldState.channel?.name as string}`);
			await this.redis.setex(key, 300000, logs.join('\n'));
		}

		if (oldState.deaf && !newState.deaf) {
			logs.push(`${time_} ${member?.user.tag as string} undeafened in ${oldState.channel?.name as string}`);
			await this.redis.setex(key, 300000, logs.join('\n'));
		}

		if (!oldState.channel && newState.channel) {
			logs.push(`${time_} ${member?.user.tag as string} joined  ${newState.channel.name}`);
			await this.redis.setex(key, 300000, logs.join('\n'));
		}

		if (oldState.channel && !newState.channel) {
			logs.push(`${time_} ${member?.user.tag as string} left ${oldState.channel.name}`);
			await this.redis.setex(key, 300000, logs.join('\n'));
		}
	}
}
