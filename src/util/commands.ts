import readdirp from 'readdirp';

import { logger } from './logger';

import { container } from 'tsyringe';
import type { Constructor } from '@sapphire/utilities';
import type { Command } from '../struct/Command';

export async function loadCommands(directory: string) {
	const commands = new Map<string, Command>();
	const commandFiles = readdirp(directory, { fileFilter: '*.js' });

	for await (const dir of commandFiles) {
		const commandMod = (await import(dir.fullPath)) as { default: Constructor<Command> };
		const command = container.resolve(commandMod.default);

		commands.set(command.name, command);
		logger.info(`Registered command: ${command.name}`);
	}

	return commands;
}
