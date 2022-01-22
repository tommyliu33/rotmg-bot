import type { Event, Headcount, RaidManager } from '../../struct';
import { Client, TextChannel } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';

import { createControlPanelChannel, createRaidChannel } from '../../functions';
import { inVetChannel, chunkButtons, generateMessageUrl } from '../../util';

import { Embed, hyperlink, inlineCode } from '@discordjs/builders';
import { Embeds } from '../../constants';

import { setTimeout } from 'node:timers';
import { toTitleCase } from '@sapphire/utilities';

// TODO: headcounts should have important reactions logged in the control panel

// TODO: this can probably be refactored
const dungeonNameIndex = ['oryx', 'shatters', 'void', 'fungal', 'nest', 'cult'];

@injectable()
export default class implements Event {
	public name = 'Raid headcounts';
	public emitter = 'raidManager';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client<true>
	) {}

	public execute() {
		this.manager.on('headcount', async (headcount: Headcount) => {
			const { guildId, channelId, leaderId, dungeon } = headcount;

			const guild = this.client.guilds.cache.get(guildId)!;
			const member = guild.members.cache.get(leaderId);

			const isVet = await inVetChannel(guildId, channelId);

			const controlPanel = await createControlPanelChannel(guild, member?.user.tag as string, isVet);

			const embed = Embeds.Headcount[dungeonNameIndex.indexOf(dungeon.name)].setTitle(
				`Headcount started by ${member?.displayName as string}`
			);

			const channel = guild.channels.cache.get(channelId) as TextChannel;
			const headCountMessage = await channel.send({
				content: '@here',
				allowedMentions: {
					parse: ['everyone'],
				},
				embeds: [embed],
				components: chunkButtons(dungeon.buttons),
			});

			const controlPanelEmbed = new Embed()
				.setDescription(
					[
						`${hyperlink('Jump to message', generateMessageUrl(guildId, channelId, headCountMessage.id))}`,
						'',
						`${inlineCode('Start afk check')} ✅`,
						`${inlineCode('Abort headcount')} 🛑`,
					].join('\n')
				)
				.setTitle(`${inlineCode(member?.user.tag as string)}'s Control Panel`)
				.setThumbnail(member?.displayAvatarURL({ dynamic: true }) as string)
				.setFooter({ text: 'Headcount' });

			const cpMsg = await controlPanel.send({
				embeds: [controlPanelEmbed],
			});
			await cpMsg.react('✅').catch(() => undefined);
			await cpMsg.react('🛑').catch(() => undefined);

			this.manager.headcounts.set(`headcount:${guild.id}:${headCountMessage.id}`, {
				...headcount,
				messageId: headCountMessage.id,
				controlPanelChannelId: controlPanel.id,
				controlPanelMessageId: cpMsg.id,
			});
		});

		this.client.on('messageReactionAdd', async (reaction, user) => {
			if (reaction.partial) await reaction.fetch();
			if (user.partial) await user.fetch();

			if (user.bot) return;

			const { message, emoji } = reaction;
			if (message.embeds[0]?.footer?.text !== 'Headcount') return;

			const key = this.manager.headcounts.findKey((h) => h.controlPanelChannelId === message.channel.id);
			if (!key) return;

			const headcount = this.manager.headcounts.get(key)!;
			if (user.id !== headcount.leaderId) return;

			const member = message.guild?.members.cache.get(user.id);

			if (emoji.toString() === '✅') {
				const channel = await createRaidChannel(
					message.guild!,
					`${member?.displayName as string}'s ${toTitleCase(headcount.dungeon.name)}'s Raid`,
					await inVetChannel(message.guildId!, headcount.channelId)
				);

				this.manager.emit('raidStart', {
					...headcount,
					voiceChannelId: channel.id,
				});
			} else if (emoji.toString() === '🛑') {
				const channel = message.guild?.channels.cache.get(headcount.channelId) as TextChannel;
				const msg = channel.messages.cache.get(headcount.messageId);

				const embed = msg?.embeds[0]
					.setTitle(`Headcount aborted by ${message.guild?.members.cache.get(user.id)?.displayName as string}`)
					.setColor(15548997)
					.setDescription('')
					.setThumbnail('');

				await msg?.edit({ content: ' ', embeds: [embed!], components: [] });
				if (msg?.reactions.cache.size) await msg.reactions.removeAll().catch(() => undefined);

				const m = await message.channel.send('Deleting channel in 10 seconds.');
				setTimeout(() => {
					void message.channel.delete().catch(() => void m.edit('Failed to delete channel, try deleting it manually.'));
				}, 10000).unref();

				this.manager.headcounts.delete(key);
			}
		});
	}
}
