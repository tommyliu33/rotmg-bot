import type { Event, Headcount, RaidManager } from '../../../struct';
import {
	Client,
	Interaction,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	TextChannel,
} from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../../tokens';

import { createControlPanelChannel } from '../../../functions';
import { arrayRandom, awaitComponent, getVoiceChannels, inVetChannel } from '../../../util';

import { Embed, inlineCode, formatEmoji } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import { nanoid } from 'nanoid';
import { zws } from '../../../constants';

import { setTimeout } from 'node:timers';

@injectable()
export default class implements Event {
	public name = 'headcount';
	public emitter = 'raidManager';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client<true>
	) {
		this.client.on('interactionCreate', this.handleControlPanelInteractions.bind(this));
	}

	public execute() {
		this.manager.on('headcount', async (headcount: Headcount) => {
			const { guildId, channelId, leaderId, dungeon } = headcount;

			const guild = this.client.guilds.cache.get(guildId)!;
			const member = guild.members.cache.get(leaderId);

			const isVet = await inVetChannel(guildId, channelId);

			const user = this.client.users.cache.get(leaderId);
			const controlPanel = await createControlPanelChannel(guild, user?.tag as string, isVet);

			const controlPanelEmbed = new Embed()
				.setTitle(`${inlineCode(user?.tag as string)} Control Panel`)
				.setDescription(
					stripIndents`
			${inlineCode('Dungeon')} ${dungeon.full_name}

			${inlineCode('Start afk check')} ✅
			${inlineCode('Abort headcount')} 🛑
			`
				)
				.setThumbnail(member?.displayAvatarURL({ dynamic: true }) as string)
				.setFooter({ text: 'Headcount' });

			if (dungeon.buttons) {
				for (const row of dungeon.buttons) {
					controlPanelEmbed.addField({
						name: zws,
						value: row.reduce((string, button) => `${string}${button.emoji as string}|0\n`, ''),
						inline: true,
					});
				}
			}

			const row = new MessageActionRow().addComponents(
				new MessageButton().setStyle('PRIMARY').setEmoji('✅').setCustomId(nanoid()),
				new MessageButton().setStyle('PRIMARY').setEmoji('🛑').setCustomId(nanoid())
			);

			const cpMsg = await controlPanel.send({ embeds: [controlPanelEmbed], components: [row] });

			const headCountEmbed = new Embed()
				.setTimestamp()
				.setColor(dungeon.color)
				.setThumbnail(arrayRandom(dungeon.images))
				.setTitle(inlineCode(dungeon.full_name))
				.setDescription(
					stripIndents`
				Click ${formatEmoji(dungeon.buttons?.[0][0].emoji as string)} if you want to participate in this run 
				Click ${formatEmoji(dungeon.buttons?.[0][1].emoji as string)} if you are willing to pop a key for this run

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

			const afkCheckChannel = guild.channels.cache.get(channelId) as TextChannel;
			const afkCheckMsg = await afkCheckChannel.send({
				content: `@here Headcount for ${inlineCode(dungeon.full_name)} started by ${member?.displayName as string}`,
				embeds: [headCountEmbed],
				components: afkCheckComponents,
				allowedMentions: {
					parse: ['everyone'],
				},
			});

			this.manager.headcounts.set(`headcount:${guild.id}:${afkCheckMsg.id}`, {
				...headcount,
				messageId: afkCheckMsg.id,
				controlPanelChannelId: controlPanel.id,
				controlPanelMessageId: cpMsg.id,
			});
		});
	}

	private async handleControlPanelInteractions(interaction: Interaction) {
		if (interaction.isButton() && interaction.inCachedGuild()) {
			const headCountReact = this.manager.headcounts.find((h) => h.controlPanelChannelId === interaction.channelId);
			const afkCheckReact = this.manager.headcounts.find(
				(h) => h.messageId === interaction.message.id && h.channelId === interaction.channelId
			);

			if (headCountReact) {
				await interaction.deferReply({ ephemeral: false });

				if (headCountReact.leaderId !== interaction.user.id) {
					const reply = await interaction.editReply({ content: 'Only the leader can manage the control panel.' });
					setTimeout(() => void reply.delete().catch(() => undefined), 2500).unref();
					return;
				}

				const emoji = interaction.component.emoji?.name as string;

				const { channelId, messageId, controlPanelChannelId } = headCountReact;

				const channel = interaction.guild.channels.cache.get(channelId) as TextChannel;
				const msg = channel.messages.cache.get(messageId);

				switch (emoji) {
					case '✅':
						const channelIds = await getVoiceChannels(interaction.guildId, channelId);

						const selectMenuOptions = [];
						for (const channelId of channelIds) {
							const channel = await interaction.guild.channels.fetch(channelId).catch(() => undefined);
							if (channel) {
								selectMenuOptions.push({
									label: channel.name,
									value: channelId,
								});
							}
						}

						const selectMenuKey = nanoid();
						const selectMenu = new MessageSelectMenu().setOptions(selectMenuOptions).setCustomId(selectMenuKey);
						const message = await interaction.editReply({
							content: 'Select a voice channel to use.',
							components: [new MessageActionRow().addComponents(selectMenu)],
						});

						const collectedInteraction = await awaitComponent(interaction.client, message, {
							componentType: 'SELECT_MENU',
							time: 60000,
						}).catch(async () => {
							await interaction.editReply({
								content: 'You failed to select a voice channel in time, click the button again to start the afk check.',
							});
							return undefined;
						});

						if (collectedInteraction?.customId === selectMenuKey) {
							const selectedChannelId = collectedInteraction.values[0];

							this.manager.emit('raidStart', {
								...headCountReact,
								voiceChannelId: selectedChannelId,
							});
							await interaction.deleteReply();
						}

						break;
					case '🛑':
						this.manager.headcounts.delete(
							this.manager.headcounts.findKey((h) => h.controlPanelChannelId === interaction.channelId) as string
						);

						const embed = new Embed()
							.setColor(15548997)
							.setTitle(inlineCode(headCountReact.dungeon.full_name))
							.setFooter({ text: 'Headcount aborted' })
							.setTimestamp();

						await msg?.edit({ content: ' ', embeds: [embed], components: [] });
						await interaction.editReply({
							content: 'Aborted the afk check. This channel will automatically be deleted in 30 seconds.',
						});

						setTimeout(() => {
							void interaction.guild.channels.cache
								.get(controlPanelChannelId)
								?.delete()
								.catch(() => undefined);
						}, 30000).unref();
				}
			}

			if (afkCheckReact) {
				await interaction.deferReply({ ephemeral: true });

				const { controlPanelChannelId, controlPanelMessageId, dungeon } = afkCheckReact;

				const controlPanelChannel = interaction.guild.channels.cache.get(controlPanelChannelId) as TextChannel;
				const message = controlPanelChannel.messages.cache.get(controlPanelMessageId);

				const embed = new MessageEmbed(message?.embeds[0]);
				const clickedButton = dungeon.buttons?.flat().find((button) => button.customId === interaction.customId);
				if (clickedButton) {
					let targettedFieldIndex = -1;

					const splitFields = embed.fields.map((field) => field.value.split('\n'));
					splitFields.find((field, index) => {
						if (field.find((element) => element.split('|')[0] === clickedButton.emoji)) {
							targettedFieldIndex = index;
							return true;
						}
						return false;
					});
					if (targettedFieldIndex === -1) return;

					const { value } = embed.fields[targettedFieldIndex];
					const updatedFieldValue = value
						.split('\n')
						.map((c) => {
							if (c.split('|').indexOf(clickedButton.emoji as string) !== -1) {
								const [emoji_, counter] = c.split('|');
								return `${emoji_}|${Number(counter) + 1}`;
							}

							return c;
						})
						.join('\n');

					embed.fields[targettedFieldIndex] = { name: zws, value: updatedFieldValue, inline: true };

					await message?.edit({
						embeds: [embed],
					});

					await interaction.editReply({ content: `You clicked on ${clickedButton.emoji as string}, logging.` });
				}
			}
		}
	}
}
