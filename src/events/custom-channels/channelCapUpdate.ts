import { Event, RaidManager } from '../../struct';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';
import type { Client } from 'discord.js';

import { isVoiceChannel } from '@sapphire/discord.js-utilities';

@injectable()
export default class implements Event {
	public name = 'channelCapUpdate';

	public emitter = 'raidManager';

	public constructor(
		@inject(kClient) public readonly client: Client<true>,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public execute() {
		this.manager.on('channelCapUpdate', async (channel, cap) => {
			const { voiceChannelId } = channel;

			const voiceChannel = this.client.channels.cache.get(voiceChannelId);
			if (isVoiceChannel(voiceChannel)) await voiceChannel.setUserLimit(cap);
		});
	}
}
