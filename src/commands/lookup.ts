import type { Command } from '../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { scrapePlayer, scrapeGuild } from 'realmeye-scrape';

import { UnsafeEmbed, Util } from 'discord.js';
import { inlineCode } from '@discordjs/builders';

import { cutText } from '@sapphire/utilities';

export default class implements Command {
	public name = 'lookup';
	public description = 'Lookup a player/guild';
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

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply();

		const embed = new UnsafeEmbed();
		switch (interaction.options.getSubcommand()) {
			case 'player':
				const playerName = interaction.options.getString('name', true);
				const player = await scrapePlayer(playerName).catch(async (reason) => {
					if (reason === `Error: '${playerName}' has a private profile or does not exist`) {
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
							name: 'Characters',
							value: player.characters?.length.toString() ?? '0',
						},
					];
					embed.addFields(...fields).setAuthor({
						name: player.name ?? playerName,
						url: player.realmEyeUrl,
					});
				}

				break;
			case 'guild':
				const guildName = interaction.options.getString('guild', true);
				const guild = await scrapeGuild(guildName).catch(async (reason) => {
					if (reason === `Guild '${guildName.replace(/\s/g, '%20')}' could not be found`) {
						await interaction.editReply(`${inlineCode(playerName)} could not be found.`);
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
				}
				break;
		}

		await interaction.editReply({ embeds: [embed] });
	}
}
