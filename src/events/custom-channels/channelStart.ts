import { Event, RaidManager } from '../../struct';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';
import type { Client } from 'discord.js';

import { isTextChannel } from '@sapphire/discord.js-utilities';
import { Embed, inlineCode } from '@discordjs/builders';

@injectable()
export default class implements Event {
	public name = 'channelStart';

	public emitter = 'raidManager';

	public constructor(
		@inject(kClient) public readonly client: Client<true>,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public execute() {
		this.manager.on('channelStart', async (channel) => {
			const { name, channelId, leaderId } = channel;

			const textChannel = this.client.channels.cache.get(channelId);
			if (!isTextChannel(textChannel)) return;

			const m = await textChannel.send({
				content: `@here ${inlineCode(name)} is now starting.`,
				allowedMentions: {
					parse: ['everyone'],
				},
				embeds: [
					new Embed()
						.setColor(0xfee75c)
						.setTitle(inlineCode(name))
						.setDescription('Please wait for the channel to unlock.'),
				],
			});

			this.manager.channels.set(`guild:${channel.guildId}channel:${leaderId}`, {
				...channel,
				messageId: m.id,
			});
		});
	}
}
