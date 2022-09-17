import { setTimeout } from 'node:timers/promises';
import {
	type Client,
	type ThreadChannel,
	ComponentType,
	inlineCode,
	ButtonBuilder,
	ButtonStyle,
	type TextChannel,
	EmbedBuilder,
} from 'discord.js';
import { container } from 'tsyringe';
import { kClient, kRaids } from '../../../tokens';
import { abortRaid } from '../abortRaid';
import { isAfkcheck, isHeadcount, Raid } from '../startRaid';
import type { RaidManager } from '#struct/RaidManager';
import {
	ABORT_ID,
	END_ID,
	FINISH_ID,
	CHANGE_LOCATION_ID,
	REVEAL_LOCATION_ID,
	generateActionRows,
} from '#util/components';

const yesKey = 'yes';
const noKey = 'no';

const yesButton = new ButtonBuilder({ customId: yesKey }).setLabel('Yes').setStyle(ButtonStyle.Primary);
const noButton = new ButtonBuilder({ customId: noKey }).setLabel('No').setStyle(ButtonStyle.Secondary);

export function controlPanelListener(raidInfo: Raid) {
	const client = container.resolve<Client>(kClient);
	const raidManager = container.resolve<RaidManager>(kRaids);

	raidInfo = raidManager.raids.get(`${raidInfo.guildId}-${raidInfo.memberId}`)!;

	const controlPanelChannel = client.channels.cache.get(raidInfo.controlPanelThreadId) as ThreadChannel | undefined;
	const controlPanelMsg = controlPanelChannel?.messages.cache.get(raidInfo.controlPanelThreadMessageId);

	if (controlPanelChannel && controlPanelMsg && (isAfkcheck(raidInfo) || isHeadcount(raidInfo))) {
		const collector = controlPanelMsg.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === raidInfo.memberId,
		});

		collector.on('collect', async (interaction) => {
			if (!interaction.isButton() || !interaction.inCachedGuild()) return;

			await interaction.deferReply();

			switch (interaction.customId) {
				case CHANGE_LOCATION_ID:
					{
						const m = await interaction.editReply({ content: 'Provide a new location for this run.' });
						const msg = await controlPanelChannel
							.awaitMessages({
								filter: (m) => m.author.id === raidInfo.memberId,
								max: 1,
							})
							.then((m) => m.first())
							.catch(() => undefined);

						if (!msg?.content) {
							await m.edit('Timer ran out.');
							return;
						}

						raidManager.raids.set(
							`${raidInfo.guildId}-${raidInfo.memberId}`,
							Object.assign(raidInfo, { location: msg.content })
						);
						// TODO: message those with location the new location
						await m.edit(`Successfully updated the location to: ${inlineCode(msg.content)}`);
					}
					break;
				case REVEAL_LOCATION_ID:
					{
						if ((raidInfo as Raid<true>).locationRevealed) {
							await interaction.editReply({ content: 'The location for this run has already been revealed.' });
							return;
						}

						const m = await interaction.editReply({
							content: 'You are about to reveal the location for this run. Are you sure?',
							components: generateActionRows([yesButton, noButton]),
						});

						const collectedInteraction = await m
							.awaitMessageComponent({
								componentType: ComponentType.Button,
								filter: (i) => i.user.id === interaction.user.id,
							})
							.catch(async () => {
								await m.edit('Timer ran out.').then(() => setTimeout(3000, () => void m.delete()));
								return undefined;
							});

						if (collectedInteraction?.customId === 'yes') {
							if (!(raidInfo as Raid<true>).location) {
								await interaction.editReply({
									content: 'You must set a location before you can reveal it.',
									components: [],
								});
								return;
							}

							const afkChannel = client.channels.cache.get(raidInfo.textChannelId) as TextChannel | undefined;
							const afkMsg = afkChannel?.messages.cache.get(raidInfo.mainMessageId);

							if (afkMsg) {
								const embed = new EmbedBuilder(afkMsg.embeds[0]!.data).setDescription(
									`${afkMsg.embeds[0]!.data.description!}\n\nThe location for this run is: ${inlineCode(
										(raidInfo as Raid<true>).location
									)}`
								);

								await afkMsg.edit({ content: afkMsg.content, components: afkMsg.components, embeds: [embed] });
								await interaction.editReply({
									content: 'You have revealed the location for this run.',
									components: [],
								});
								await collectedInteraction.deleteReply().catch(() => undefined);

								// TODO: update raid to update locationRevealed state
							}
						} else if (collectedInteraction?.customId === 'no') {
							await collectedInteraction.reply('The action was aborted.');
						}
					}
					break;
				case ABORT_ID:
					{
						const m = await interaction.editReply({
							content: 'You are about to abort this raid. Are you sure?',
							components: generateActionRows([yesButton, noButton]),
						});
						const collectedInteraction = await m
							.awaitMessageComponent({
								componentType: ComponentType.Button,
								time: 60_000,
							})
							.catch(async () => {
								await m.edit({ content: 'Timer ran out.' });
								return undefined;
							});

						if (collectedInteraction?.customId === 'yes' && abortRaid(raidInfo)) {
							await collectedInteraction.reply('You aborted this run.');
						} else if (collectedInteraction?.customId === 'no') {
							await collectedInteraction.reply('The action was aborted.');
						}
					}
					break;
				case END_ID:
					{
						const afkChannel = client.channels.cache.get(raidInfo.textChannelId) as TextChannel | undefined;
						const afkMsg = afkChannel?.messages.cache.get(raidInfo.mainMessageId);

						if (afkMsg) {
							if (isAfkcheck(raidInfo)) {
								// TODO: Thank you to POPPER for popping a key for us.
								const embed = new EmbedBuilder()
									.setColor(raidInfo.dungeon.color)
									.setAuthor({
										name: `${raidInfo.dungeon.name} started by ${
											afkChannel?.guild.members.cache.get(raidInfo.memberId)?.displayName ?? 'the leader'
										}`,
										iconURL: afkChannel?.guild.members.cache.get(raidInfo.memberId)?.displayAvatarURL(),
									})
									.setDescription('This AFK check has been ended. Please wait for the next one to start.')
									.setFooter({ text: 'This afk check ended' })
									.setTimestamp()
									.setThumbnail(null);
								await afkMsg.edit({ embeds: [embed], components: [] });
								await interaction.deleteReply();
							} else {
								const embed = new EmbedBuilder()
									.setColor(raidInfo.dungeon.color)
									.setAuthor({
										name: `${raidInfo.dungeon.name} Headcount ended by ${
											afkChannel?.guild.members.cache.get(raidInfo.memberId)?.displayName ?? 'the leader'
										}`,
										iconURL: afkChannel?.guild.members.cache.get(raidInfo.memberId)?.displayAvatarURL(),
									})
									.setDescription('This Headcount has been ended. Please wait for the run to start.')
									.setFooter({ text: 'This headcount ended' })
									.setTimestamp()
									.setThumbnail(null);
								await afkMsg.edit({ embeds: [embed], components: [] });
								await interaction.deleteReply();
							}
						}
					}
					break;
				case FINISH_ID:
					{
						const afkChannel = client.channels.cache.get(raidInfo.textChannelId) as TextChannel | undefined;
						const afkMsg = afkChannel?.messages.cache.get(raidInfo.mainMessageId);

						if (afkMsg) {
							// TODO: check for staff role and dont move them and move everyone else out
							await interaction.deleteReply();
						}
					}
					break;
			}
		});
	}
}
