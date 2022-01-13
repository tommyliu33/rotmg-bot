import type { Event, Headcount, Raid, RaidManager } from '../../../struct';
import { Client, MessageActionRow, MessageButton, TextChannel } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../../tokens';

import { createControlPanelChannel } from '../../../functions';
import { arrayRandom, inVetChannel } from '../../../util';

import { Embed, inlineCode, channelMention } from '@discordjs/builders';
import { stripIndents } from 'common-tags';

import { toTitleCase } from '@sapphire/utilities';

import { Buttons } from '../../../constants';

@injectable()
export default class implements Event {
	public name = 'raidStart';
	public emitter = 'raidManager';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client<true>
	) {}

	public execute() {
		this.manager.on('raidStart', async (raid: Raid | Headcount) => {
			const isRaid = raid.location.length === 0 ? true : false;

			if (isRaid) {
				raid = raid as Raid;

				const { dungeon, channelId } = raid;

				const afkCheckEmbed = new Embed()
					.setTimestamp()
					.setColor(dungeon.color)
					.setThumbnail(arrayRandom(dungeon.images))
					.setTitle(inlineCode(dungeon.full_name))
					.setDescription(
						stripIndents`
			Click ${dungeon.buttons?.[0][0].emoji as string} if you want to participate in this run 
			Click ${dungeon.buttons?.[0][1].emoji as string} if you are willing to pop a key for this run

			Otherwise, click on the corresponding button for 
			class/gear choices that you are bringing
			`
					);

				const afkCheckComponents: MessageActionRow[] = [];
				if (dungeon.buttons) {
					for (let i = 0; i < dungeon.buttons.length; ++i) {
						if (!afkCheckComponents[i]) afkCheckComponents.push(new MessageActionRow());
						// eslint-disable-next-line @typescript-eslint/prefer-for-of
						for (let j = 0; j < dungeon.buttons[i].length; ++j) {
							if (afkCheckComponents[i].components.length >= 5) afkCheckComponents.push(new MessageActionRow());
							const lastRow = afkCheckComponents[afkCheckComponents.length - 1];
							lastRow.addComponents(new MessageButton(dungeon.buttons[i][j]));
						}
					}
				}

				const guild = this.client.guilds.cache.get(raid.guildId);
				const afkCheckChannel = guild?.channels.cache.get(raid.channelId) as TextChannel;
				const member = guild?.members.cache.get(raid.leaderId);

				const afkCheckMsg = await afkCheckChannel.send({
					content: `@here ${member?.displayName as string} has started a ${toTitleCase(
						dungeon.name
					)} AFK Check in ${channelMention(raid.voiceChannelId)}`,
					embeds: [afkCheckEmbed],
					components: afkCheckComponents,
					allowedMentions: {
						parse: ['everyone'],
					},
				});

				const controlPanelChannel = await createControlPanelChannel(
					guild!,
					member?.user.tag as string,
					await inVetChannel(raid.guildId, channelId)
				);
				await controlPanelChannel.setTopic('raid');

				const controlPanelEmbed = new Embed()
					.setTitle(`${inlineCode(member?.user.tag as string)} Control Panel`)
					.setFooter({ text: 'Afkcheck' })
					.setDescription(
						stripIndents`
					${inlineCode('Dungeon')} ${raid.dungeon.full_name}
					${inlineCode('Voice channel')} ${channelMention(raid.voiceChannelId)}
		
					${inlineCode('Edit location')} 📝 
					${inlineCode('Reveal location')} 🗺️

					${inlineCode('Abort afk')} 🛑
					${inlineCode('End afk')} ❌
					`
					)
					.addField({ name: 'Location', value: raid.location === '' ? 'Not set' : raid.location })
					.setThumbnail(guild?.members.cache.get(raid.leaderId)?.displayAvatarURL({ dynamic: true }) as string);

				const controlPanelMessage = await controlPanelChannel.send({
					embeds: [controlPanelEmbed],
					components: [Buttons.controlPanelButtons],
				});

				this.manager.raids.set(`raid:${raid.guildId}:${afkCheckMsg.id}`, {
					...raid,
					controlPanelChannelId: controlPanelChannel.id,
					controlPanelMessageId: controlPanelMessage.id,
				});
			} else {
				this.manager.headcounts.delete(`headcount:${raid.guildId}:${raid.messageId}`);

				const {
					channelId,
					messageId,
					leaderId,
					dungeon,
					voiceChannelId,
					controlPanelChannelId,
					controlPanelMessageId,
				} = raid as Headcount;

				const channel = this.client.channels.cache.get(channelId) as TextChannel;
				const message = channel.messages.cache.get(messageId);

				const member = channel.guild.members.cache.get(leaderId);

				const pingMessage = `@here ${member?.displayName as string} has started a ${toTitleCase(
					dungeon.name
				)} raid in ${channelMention(voiceChannelId)}.`;
				await message?.edit({
					content: pingMessage,
					allowedMentions: {
						parse: ['everyone'],
					},
				});

				await channel
					.send({
						content: `${pingMessage} (Re-ping)`,
						allowedMentions: {
							parse: ['everyone'],
						},
					})
					.then((m) => void m.delete());

				const controlPanelChannel = this.client.channels.cache.get(controlPanelChannelId) as TextChannel;
				const controlPanelMessage = controlPanelChannel.messages.cache.get(controlPanelMessageId);

				const controlPanelEmbed = controlPanelMessage!.embeds[0];

				await controlPanelMessage?.edit({
					embeds: [
						controlPanelEmbed
							.setDescription(
								stripIndents`
					${inlineCode('Dungeon')} ${dungeon.full_name}
					${inlineCode('Voice channel')} ${channelMention(voiceChannelId)}
		
					${inlineCode('Edit location')} 📝 
					${inlineCode('Reveal location')} 🗺️

					${inlineCode('Abort afk')} 🛑
					${inlineCode('End afk')} ❌
					`
							)
							.setFooter({ text: 'Afkcheck' }),
					],
					components: [Buttons.controlPanelButtons],
				});
			}
		});
	}
}
