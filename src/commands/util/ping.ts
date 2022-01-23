import type { Command } from '../../Command';
import type { CommandInteraction } from 'discord.js';

export default class implements Command {
	public name = 'ping';
	public description = 'Pong.';

	public execute(interaction: CommandInteraction) {
		void interaction.reply('pong.');
	}
}
