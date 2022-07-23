import type { Entity, InstanceType } from '@ayanaware/bento';
import type { AutocompleteInteraction, Awaitable, ChatInputCommandInteraction } from 'discord.js';
import type { CommandManager } from './CommandManager';

export interface CommandEntity extends Entity {
	parent: InstanceType<CommandManager>;

	run: (interaction: ChatInputCommandInteraction<'cached'>) => Awaitable<void>;
	autocomplete?: (interaction: AutocompleteInteraction<'cached'>) => Awaitable<void>;
}
