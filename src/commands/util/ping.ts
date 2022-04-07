import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command {
	public name = 'ping';
	public description = 'pong.';

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply('pong.');
	}
}
