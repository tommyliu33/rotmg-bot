import type { CommandInteraction } from 'discord.js';
import { Command } from '@struct';

export default class implements Command {
	public name = 'ping';
	public description = 'pong.';

	public execute(interaction: CommandInteraction) {
		void interaction.reply('pong');
	}
}
