import { ellipsis } from '@chatsift/discord-utils';
import { inlineCode, hyperlink } from '@discordjs/builders';
import { scrapePlayer, scrapeGuild } from '@toommyliu/realmeye-scraper';
import { stripIndents } from 'common-tags';
import { ButtonStyle } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, escapeMarkdown } from 'discord.js';
import { paginate } from '../../functions/paginate';
import type { Command } from '#struct/Command';
import { generateActionRows } from '#util/components';

export default class implements Command {
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const m = await interaction.deferReply({ fetchReply: true });

		const embed = new EmbedBuilder();
		switch (interaction.options.getSubcommand()) {
			case 'player':
				const playerName = interaction.options.getString('name', true);
				const player = await scrapePlayer(playerName).catch(async (err: Error) => {
					if (err.message === 'Player not found') {
						await interaction.editReply(`${inlineCode(playerName)} could not be found or has a private profile.`);
						return undefined;
					}

					await interaction.editReply('An error occured while trying to fetch player profile.');
					return undefined;
				});

				if (player) {
					if (player.description) embed.setDescription(escapeMarkdown(player.description));

					const fields = [
						{
							name: 'Experience',
							value:
								player.characters?.reduce((exp, char) => char.exp ?? 0 + exp, 0).toString() ??
								player.exp?.toString() ??
								'0',
							inline: true,
						},
						{
							name: 'Fame',
							value: player.characters?.reduce((fame, char) => char.fame + fame, 0).toString() ?? '0',
							inline: true,
						},
					];
					embed.addFields(...fields).setAuthor({
						name: player.name ?? playerName,
						url: player.realmEyeUrl,
					});

					const viewCharacters = new ButtonBuilder()
						.setCustomId('view_characters')
						.setStyle(ButtonStyle.Primary)
						.setLabel('View Characters');

					const extraOptions: { components: any[] } = { components: [] };
					if (player.characters?.length) {
						extraOptions.components = [new ActionRowBuilder<ButtonBuilder>().addComponents(viewCharacters)];
					}

					await interaction.editReply({
						embeds: [embed],
						...extraOptions,
					});

					const collectedInteraction = await m
						.awaitMessageComponent({
							componentType: ComponentType.Button,
						})
						.catch(async () => {
							await interaction.editReply({ components: [] });
							return undefined;
						});

					// TODO: remove stripIndents / common-tags
					if (collectedInteraction?.customId === 'view_characters') {
						const embeds = [];
						if (player.characters?.length) {
							for (let i = 0; i < player.characters.length; ++i) {
								const character = player.characters[i];
								const embed = new EmbedBuilder()
									.setAuthor({
										name: player.name ?? playerName,
										url: player.realmEyeUrl,
									})
									.setDescription(
										stripIndents`
								${inlineCode('Class')} ${character.class}
								${inlineCode('Experience')} ${character.exp ?? 0}
								${inlineCode('Fame')} ${character.fame}
							
								${inlineCode('Weapon')} ${hyperlink(
											character.equipment?.weapon?.name ?? 'n/a',
											character.equipment?.weapon?.realmEyeUrl ?? ''
										)}
								${inlineCode('Ability')} ${hyperlink(
											character.equipment?.ability?.name ?? 'n/a',
											character.equipment?.ability?.realmEyeUrl ?? ''
										)}
								${inlineCode('Armor')} ${hyperlink(
											character.equipment?.armor?.name ?? 'n/a',
											character.equipment?.armor?.realmEyeUrl ?? ''
										)}
								${inlineCode('Ring')} ${hyperlink(
											character.equipment?.ring?.name ?? 'n/a',
											character.equipment?.ring?.realmEyeUrl ?? ''
										)}
								`
									)
									.setFooter({ text: `Character ${i + 1}/${player.characters.length}` });
								embeds.push(embed);
							}
						}

						await paginate(collectedInteraction, embeds);
					}
				}
				break;
			case 'guild':
				const guildName = interaction.options.getString('guild', true);
				const guild = await scrapeGuild(guildName).catch(async (err: Error) => {
					if (err.message === 'Guild not found') {
						await interaction.editReply(`${inlineCode(guildName)} could not be found.`);
						return undefined;
					}

					await interaction.editReply('An error occured while trying to fetch guild.');
					return undefined;
				});

				if (guild) {
					if (guild.description) embed.setDescription(escapeMarkdown(guild.description));

					const fields = [
						{
							name: 'Total fame',
							value: guild.fame?.toString() ?? '0',
							inline: true,
						},
						{
							name: 'Total experience',
							value: guild.exp?.toString() ?? '0',
							inline: true,
						},
						{
							name: `Members (${guild.members?.length.toString() ?? guild.memberCount ?? '0'})`,
							value: guild.members?.length
								? ellipsis(
										guild.members
											.filter((member) => member.name !== 'Private')
											.map((member) => member.name)
											.join(', '),
										1024
								  )
								: 'N/A',
						},
						{
							name: 'Character count',
							value: guild.characterCount?.toString() ?? '0',
						},
					];
					embed.addFields(...fields).setAuthor({
						name: guild.name ?? guildName,
						url: guild.realmEyeUrl,
						iconURL: 'https://www.realmeye.com/s/a/img/eye-big.png',
					});

					const viewTopButton = new ButtonBuilder()
						.setCustomId('view')
						.setStyle(ButtonStyle.Primary)
						.setLabel('View Top Members');

					await interaction.editReply({
						embeds: [embed],
						components: generateActionRows([viewTopButton]),
					});

					const collectedInteraction = await m
						.awaitMessageComponent({
							filter: (i) => i.user.id === interaction.user.id,
							componentType: ComponentType.Button,
							time: 50_000 * 6,
						})
						.catch(async () => {
							await m.edit({ components: [] });
							return undefined;
						});

					if (collectedInteraction?.customId === 'view') {
						const top = guild.members!.sort((a, b) => b.fame! - a.fame!).slice(0, 10);

						const embed_ = new EmbedBuilder()
							.setAuthor({
								name: `${guild.name ?? guildName} Top Public Characters`,
								url: guild.realmEyeUrl,
								iconURL: 'https://www.realmeye.com/s/a/img/eye-big.png',
							})
							.setDescription(
								top
									.map(
										(member, i) =>
											`**${++i}**. ${hyperlink(member.name!, member.realmEyeUrl!)} - ${
												member.fame?.toLocaleString() ?? 0
											}`
									)
									.join('\n')
							);

						await collectedInteraction.update({ embeds: [embed_.toJSON()], components: [] });
					}
				}
				break;
		}
	}
}
