import type { CommandInteraction } from 'discord.js';
import { Command } from '@struct';

export default class implements Command {
	public name = 'requirements';
	public description = 'Configure verification requirements for a section.';

	public options = [
		{
			name: 'section',
			description: 'The section requirements to use',
			type: 3,
			choices: [
				{
					name: 'Main',
					value: 'main',
				},
				{
					name: 'Veteran',
					value: 'veteran',
				},
			],
			required: true,
		},
		{
			name: 'private_loc',
			description: 'User requires private location to verify',
			type: 5,
		},
		{
			name: 'rank',
			description: 'Minimum account rank to verify',
			type: 4,
			min_value: 0,
			max_value: 90,
		},
		{
			name: 'o3',
			description: 'Minimum Oryx Sanctuary completes',
			type: 4,
		},
		{
			name: 'void',
			description: 'Minimum The Void completes',
			type: 4,
		},
		{
			name: 'shatters',
			description: 'Minimum The Shatters completes',
			type: 4,
		},
		{
			name: 'cult',
			description: 'Minimum Cultist Hideout completes',
			type: 4,
		},
		{
			name: 'nest',
			description: 'Minimum The Nest completes',
			type: 4,
		},
		{
			name: 'fungal',
			description: 'Minimum Fungal Cavern completes',
			type: 4,
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.reply('hello world');
	}
}
