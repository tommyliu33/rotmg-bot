import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

export default class implements Command {
	public name = 'verify_message';
	public description = "Sends the section's verification requirements";
	public options = [
		{
			type: 1,
			name: 'edit',
			description: 'Update the verification message',
			options: [
				{
					type: 3,
					name: 'section',
					description: 'The section requirements to edit',
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
			],
		},
		{
			type: 1,
			name: 'send',
			description: 'Send the verification message',
			options: [
				{
					type: 3,
					name: 'section',
					description: 'The section to send the message in',
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
			],
		},
	];

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });

		if (interaction.options.getSubcommand(true) === 'edit') {
		}

		await interaction.editReply('no');
	}
}
