import 'reflect-metadata';
import 'dotenv/config';

import { Client } from 'discord.js';

import readdirp from 'readdirp';
import { container } from 'tsyringe';

import { kClient, kCommands } from './tokens';

import type { Command } from './Command';
import type { Event } from './Event';

import type { Class } from 'type-fest';

import { logger } from './util/logger';

const client = new Client({
	intents: [],
});

const commands = new Map<string, Command>();

container.register(kClient, { useValue: client });
container.register(kCommands, { useValue: commands });

for await (const { fullPath } of readdirp('./commands')) {
	const mod = (await import(fullPath)) as { default: Class<Command> };
	const command = container.resolve<Command>(mod.default);

	commands.set(command.name, command);
	logger.info(`Registered command: ${command.name}`);
}

for await (const { fullPath } of readdirp('./events')) {
	const mod = (await import(fullPath)) as { default: Class<Event> };
	const event = container.resolve<Event>(mod.default);

	client.on(event.name, async (...args: unknown[]) => event.execute(...args));
	logger.info(`Registered event: ${event.name}`);
}

await client.login();
