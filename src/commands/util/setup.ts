import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command {
	public name = 'setup';
	public description = 'setup stuff.';
	public options = [
		{
			type: 1,
			name: 'view',
			description: 'view',
			options: [],
		},
		{
			type: 1,
			name: 'edit',
			description: 'edit',
			options: [],
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply('pong.');
	}
}
