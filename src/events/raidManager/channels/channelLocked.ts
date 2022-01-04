import { Event, RaidManager } from '../../../struct';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../../tokens';
import type { Client } from 'discord.js';

import { isVoiceChannel, isTextChannel } from '@sapphire/discord.js-utilities';
import { Embed, inlineCode, time } from '@discordjs/builders';

@injectable()
export default class implements Event {
	public name = 'channelLocked';

	public emitter = 'raidManager';

	public constructor(
		@inject(kClient) public readonly client: Client<true>,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public execute() {
		this.manager.on('channelLocked', async (channel) => {
			const { name, channelId, voiceChannelId, messageId, roleId } = channel;

			const voiceChannel = this.client.channels.cache.get(voiceChannelId);
			if (isVoiceChannel(voiceChannel)) {
				await voiceChannel.permissionOverwrites
					.edit(roleId, {
						CONNECT: false,
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
							.setColor(0xed4245)
							.setTitle(inlineCode(name))
							.setDescription(`Channel locked ${time(new Date(), 'R')}`),
					],
				});
			}
		});
	}
}
