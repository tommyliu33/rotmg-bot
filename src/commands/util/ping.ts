import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

export default class implements Command {
	public name = 'ping';
	public description = 'pong.';

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply('pong.');
	}
}
