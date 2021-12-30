import type { CommandInteraction } from 'discord.js';
import { Command } from '@struct';

export default class implements Command {
	public name = 'logs';
	public description = 'Displays the most recent logs for a specific action of a user';

	/**
	 * TODO:
	 * logs view type user
	 * logs toggle type
	 */
	public options = [
		{
			name: 'type',
			description: 'Log type to use (stores from 5min ago)',
			type: 3,
			choices: [
				{
					name: 'Voice state',
					value: 'voiceState',
				},
			],
			required: true,
		},
		{
			name: 'user',
			description: 'User to target',
			type: 6,
			required: true,
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.reply('hi');
	}
}
