import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '#components/CommandEntity';

import { CommandManager } from '#components/CommandManager';

export default class implements CommandEntity {
	public name = 'commands:ping';
	public parent = CommandManager;

	public run(interaction: ChatInputCommandInteraction<'cached'>) {
		void interaction.reply('pong.');
	}
}
