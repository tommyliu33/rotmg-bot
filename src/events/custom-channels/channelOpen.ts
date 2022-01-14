import { Event, RaidManager } from '../../struct';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';
import type { Client } from 'discord.js';

import { Embed, inlineCode, time } from '@discordjs/builders';
import { isTextChannel, isVoiceChannel } from '@sapphire/discord.js-utilities';

@injectable()
export default class implements Event {
	public name = 'channelOpen';

	public emitter = 'raidManager';

	public constructor(
		@inject(kClient) public readonly client: Client<true>,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public execute() {
		this.manager.on('channelOpen', async (channel) => {
			const { name, channelId, voiceChannelId, messageId, roleId } = channel;

			const voiceChannel = this.client.channels.cache.get(voiceChannelId);
			if (isVoiceChannel(voiceChannel)) {
				await voiceChannel.permissionOverwrites
					.edit(roleId, {
						CONNECT: true,
					})
					.catch(() => undefined);
			}

			const textChannel = this.client.channels.cache.get(channelId);
			if (isTextChannel(textChannel)) {
				await textChannel
					.send({
						content: `@here ${inlineCode(name)} has opened (re-ping)`,
						allowedMentions: {
							parse: ['everyone'],
						},
					})
					.then((m) => void m.delete());

				const msg = textChannel.messages.cache.get(messageId);
				await msg?.edit({
					content: ' ',
					embeds: [
						new Embed()
							.setColor(0x57f287)
							.setTitle(inlineCode(name))
							.setDescription(`Channel opened ${time(new Date(), 'R')}`),
					],
				});
			}
		});
	}
}
