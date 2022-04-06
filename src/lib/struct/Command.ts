import type { AutocompleteInteraction, ChatInputCommandInteraction, Awaitable } from 'discord.js';
import type { APIApplicationCommandOption } from 'discord-api-types/v10';

export interface Command {
	name: string;
	description: string;
	options?: APIApplicationCommandOption[];

	run: (interaction: ChatInputCommandInteraction<'cached'>) => Awaitable<void>;
	autocomplete?: (interaction: AutocompleteInteraction<'cached'>) => Awaitable<void>;
}
