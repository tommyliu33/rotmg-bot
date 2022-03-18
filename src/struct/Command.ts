import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import type { APIApplicationCommandOption } from 'discord-api-types/v9';

export interface Command {
	name: string;
	description: string;
	options?: APIApplicationCommandOption[];

	// TODO: cachetype to cached 
	run: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
	autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void;
}
