import { Event, RaidManager } from '../../struct';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';
import type { Client } from 'discord.js';

import { Embed, inlineCode, time } from '@discordjs/builders';
import { isTextChannel } from '@sapphire/discord.js-utilities';

@injectable()
export default class implements Event {
	public name = 'channelClose';

	public emitter = 'raidManager';

	public constructor(
		@inject(kClient) public readonly client: Client<true>,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public execute() {
		this.manager.on('channelClose', async (channel) => {
			const { guildId, leaderId, channelId, voiceChannelId, messageId, name } = channel;

			this.manager.channels.delete(`guild:${guildId}channel:${channelId}leader:${leaderId}`);

			const guild = this.client.guilds.cache.get(guildId);

			const voiceChannel = guild?.channels.cache.get(voiceChannelId);
			if (voiceChannel) await voiceChannel.delete();

			const textChannel = guild?.channels.cache.get(channelId);
			if (isTextChannel(textChannel)) {
				const message = textChannel.messages.cache.get(messageId);

				await message?.edit({
					content: ' ',
					embeds: [
						new Embed()
							.setColor(0x992d22)
							.setTitle(inlineCode(name))
							.setDescription(`Channel closed ${time(new Date(), 'R')}`),
					],
				});
			}
		});
	}
}
