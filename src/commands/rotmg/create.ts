import type { CategoryChannel, CommandInteraction } from 'discord.js';

import { Command } from '../../struct';
import { getGuildSetting } from '../../functions';

import { setTimeout } from 'timers/promises';

export default class implements Command {
	public name = 'create';
	public description = 'creates channels and saves them for future raiding sessions.';

	public options = [
		{
			name: 'voice',
			description: 'subcommand for creating raiding channels',
			type: 1,
			options: [
				{
					name: 'section',
					description: 'the section to create voice channels in',
					type: 3,
					choices: [
						{
							name: 'main',
							value: 'main',
						},
						{
							name: 'veteran',
							value: 'veteran',
						},
					],
					required: true,
				},
			],
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'voice') {
			const section = interaction.options.getString('section', true);

			const sectionId = await getGuildSetting(
				interaction.guildId,
				section === 'veteran' ? 'VetSection' : 'MainSection'
			);

			if (!sectionId) {
				await interaction.editReply({
					content: `Set the ${section} section before running this command.`,
				});
				return;
			}

			const category = (await interaction.guild.channels.fetch(sectionId)) as CategoryChannel | undefined;

			if (!category) {
				await interaction.editReply({
					content: 'I was unable to fetch the category.',
				});
				return;
			}

			for (let i = 0; i < 5; ++i) {
				void setTimeout(750);
				await category.createChannel(`Raiding ${i + 1}`, {
					type: 'GUILD_VOICE',
					userLimit: 30,
					position: 0,
				});
			}

			await interaction.editReply({ content: 'Done.' });
		}
	}
}
