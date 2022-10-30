import { extname, basename } from 'node:path';
import type {
	ApplicationCommandOptionChoiceData,
	ApplicationCommandType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
	UserContextMenuCommandInteraction,
} from 'discord.js';

type InteractionTypeMapping = {
	[ApplicationCommandType.ChatInput]: ChatInputCommandInteraction<'cached'>;
	[ApplicationCommandType.User]: UserContextMenuCommandInteraction<'cached'>;
	[ApplicationCommandType.Message]: MessageContextMenuCommandInteraction<'cached'>;
};

export type CommandBody<Type extends ApplicationCommandType> = RESTPostAPIApplicationCommandsJSONBody & {
	type: Type;
};

export type Command<Type extends ApplicationCommandType = ApplicationCommandType> = {
	handle(interaction: InteractionTypeMapping[Type]): Awaited<unknown>;
	handleAutocomplete?(interaction: AutocompleteInteraction<any>): Awaited<ApplicationCommandOptionChoiceData[]>;
};

export type CommandInfo = {
	name: string;
};

export function commandInfo(path: string): CommandInfo | null {
	if (extname(path) !== '.js') {
		return null;
	}

	return { name: basename(path, '.js') };
}
