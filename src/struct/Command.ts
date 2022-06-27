import type { AutocompleteInteraction, ChatInputCommandInteraction, Awaitable } from 'discord.js';

export interface Command {
	run: (interaction: ChatInputCommandInteraction<'cached'>) => Awaitable<void>;
	autocomplete?: (interaction: AutocompleteInteraction<'cached'>) => Awaitable<void>;
}
