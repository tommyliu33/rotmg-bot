import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { scrapePlayer, scrapeGuild } from '@toommyliu/realmeye-scraper';

import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, Util } from 'discord.js';
import { inlineCode, hyperlink } from '@discordjs/builders';
import { ButtonStyle } from 'discord-api-types/v10';

import { cutText } from '@sapphire/utilities';
import { FAME_EMOJI_ID } from '../../constants';
import { paginate } from '../../functions/paginate';

import { stripIndents } from 'common-tags';

export default class implements Command {
	public name = 'realmeye';
	public description = 'Realmeye search';
	public options = [
		{
			type: 1,
			name: 'guild',
			description: 'Lookup a guild',
			options: [
				{
					type: 3,
					name: 'guild',
					description: 'The guild name',
					required: true,
				},
			],
		},
		{
			type: 1,
			name: 'player',
			description: 'Lookup a player',
			options: [
				{
					type: 3,
					name: 'name',
					description: 'The player name',
					required: true,
				},
			],
		},
	];

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
					if (player.description) embed.setDescription(Util.escapeMarkdown(player.description));

					const fields = [
						{
							name: 'Experience',
							value:
								player.characters?.reduce((exp, char) => char?.exp ?? 0 + exp, 0).toString() ??
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

					await interaction.editReply({
						embeds: [embed],
						components: [new ActionRowBuilder<ButtonBuilder>().addComponents(viewCharacters)],
					});

					const collectedInteraction = await m
						.awaitMessageComponent({
							componentType: ComponentType.Button,
						})
						.catch(async () => {
							await interaction.editReply({ components: [] });
							return undefined;
						});

					if (collectedInteraction?.customId === 'view_characters') {
						const embeds = [];
						if (player?.characters) {
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
								${inlineCode('Fame')} ${character.fame ?? 0}
							
								${inlineCode('Weapon')} ${hyperlink(
											character.equipment?.weapon?.name ?? 'n/a',
											character.equipment?.weapon?.realmEyeUrl ?? 'https://realmeye.com'
										)}
								${inlineCode('Ability')} ${hyperlink(
											character.equipment?.ability?.name ?? 'n/a',
											character.equipment?.ability?.realmEyeUrl ?? 'https://realmeye.com'
										)}
								${inlineCode('Armor')} ${hyperlink(
											character.equipment?.armor?.name ?? 'n/a',
											character.equipment?.armor?.realmEyeUrl ?? 'https://realmeye.com'
										)}
								${inlineCode('Ring')} ${hyperlink(
											character.equipment?.ring?.name ?? 'n/a',
											character.equipment?.ring?.realmEyeUrl ?? 'https://realmeye.com'
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
					if (guild.description) embed.setDescription(Util.escapeMarkdown(guild.description));

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
								? cutText(
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
						components: [new ActionRowBuilder<ButtonBuilder>().addComponents(viewTopButton)],
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
											}${interaction.client.emojis.cache.get(FAME_EMOJI_ID)?.toString() ?? ''}`
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
