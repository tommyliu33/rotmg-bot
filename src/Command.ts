import type { CommandInteraction, ApplicationCommandOptionData } from 'discord.js';

export interface Command {
	name: string;
	description: string;
	options?: ApplicationCommandOptionData[];

	execute: (interaction: CommandInteraction) => Promise<void> | void;
}
