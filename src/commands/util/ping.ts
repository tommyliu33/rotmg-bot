import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command {
	public run(interaction: ChatInputCommandInteraction<'cached'>) {
		void interaction.reply('pong.');
	}
}
