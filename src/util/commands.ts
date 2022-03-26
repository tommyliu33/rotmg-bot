import readdirp from 'readdirp';
import { logger } from './logger';
import { container } from 'tsyringe';
import type { Command } from '../struct/Command';

export async function loadCommands(directory: string) {
	const commands = new Map<string, Command>();
	const commandFiles = readdirp(directory, { fileFilter: '*.js' });

	for await (const dir of commandFiles) {
		const commandMod = (await import(dir.fullPath)) as { default: Constructor<Command> };
		const command = container.resolve(commandMod.default);

		if (commands.has(command.name)) {
			commands.set(command.name, {
				...command,
				options: [...commands.get(command.name)!.options!, ...command.options!],
			});
		} else {
			commands.set(command.name, command);
			logger.info(`Registered command: ${command.name}`);
		}
	}

	return commands;
}

type Constructor<T> = new (...args: any[]) => T;
