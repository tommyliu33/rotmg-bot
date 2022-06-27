import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command {
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply('pong.');
	}
}
