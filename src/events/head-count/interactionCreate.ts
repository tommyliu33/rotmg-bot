import type { Event, RaidManager } from '../../struct';
import { Client, MessageActionRow, MessageEmbed, MessageSelectMenu, TextChannel } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';

import { Embed, inlineCode } from '@discordjs/builders';
import { nanoid } from 'nanoid';
import { zws } from '../../constants';
import { getVoiceChannels, awaitComponent } from '../../util';

@injectable()
export default class implements Event {
	public name = 'interactionCreate';
	public emitter = 'client';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client<true>
	) {}

	public execute() {
		this.client.on('interactionCreate', async (interaction) => {
			if (interaction.isButton() && interaction.inCachedGuild()) {
				const headCountReact = this.manager.headcounts.find((h) => h.controlPanelChannelId === interaction.channelId);
				const afkCheckReact = this.manager.headcounts.find(
					(h) => h.messageId === interaction.message.id && h.channelId === interaction.channelId
				);

				if (headCountReact) {
					await interaction.deferReply({ ephemeral: false });

					if (headCountReact.leaderId !== interaction.user.id) {
						const reply = await interaction.editReply({ content: 'Only the leader can manage the raid.' });
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
									content:
										'You failed to select a voice channel in time, click the button again to start the afk check.',
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
								.setTitle(inlineCode(headCountReact.dungeon.fullName))
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
					const clickedButton = dungeon.buttons.flat().find((button) => button.customId === interaction.customId);
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
		});
	}
}
