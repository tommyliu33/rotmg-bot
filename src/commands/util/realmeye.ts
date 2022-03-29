import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { scrapePlayer, scrapeGuild } from '@toommyliu/realmeye-scraper';

import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, Util } from 'discord.js';
import { inlineCode, hyperlink } from '@discordjs/builders';
import { ButtonStyle } from 'discord-api-types/v10';

import { nanoid } from 'nanoid';

import { cutText } from '@sapphire/utilities';
import { FAME_EMOJI_ID } from '../../constants';

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

				if (!player) {
					await interaction.editReply({ embeds: [embed.setDescription('No player found.')] });
					return;
				}

				if (player) {
					if (player.description) embed.setDescription(Util.escapeMarkdown(player.description));

					const fields = [
						{
							name: 'Characters',
							value: player.characters?.length.toString() ?? '0',
						},
						{
							name: 'Fame',
							value: player.characters?.reduce((fame, char) => char.fame + fame, 0).toString() ?? '0',
						},
					];
					embed.addFields(...fields).setAuthor({
						name: player.name ?? playerName,
						url: player.realmEyeUrl,
					});

					await interaction.editReply({ embeds: [embed] });
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
					});

					if (guild.members?.findIndex((member) => member.name === 'Private'))
						embed.setFooter({ text: 'Private profiles may be excluded' });

					const viewKey = nanoid();
					const viewTopButton = new ButtonBuilder()
						.setCustomId(viewKey)
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
							await m.edit({
								components: [new ActionRowBuilder<ButtonBuilder>().addComponents(viewTopButton.setDisabled(true))],
							});
							return undefined;
						});

					if (collectedInteraction?.customId === viewKey) {
						const top = guild.members!.sort((a, b) => b.fame! - a.fame!).slice(0, 10);

						const embed_ = new EmbedBuilder()
							.setAuthor({
								name: `${guild.name ?? guildName} Top Public Characters`,
								url: guild.realmEyeUrl,
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
