import 'reflect-metadata';
import 'dotenv/config';

import { basename } from 'node:path';
import { Client, IntentsBitField, ClientEvents } from 'discord.js';

import readdirp from 'readdirp';
import { container } from 'tsyringe';
import { kClient, kCommands, kRaids } from './tokens';

import { logger } from './util/logger';

import type { Command } from '#struct/Command';
import type { Event } from '#struct/Event';
import { RaidManager } from '#struct/RaidManager';

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildVoiceStates,
		IntentsBitField.Flags.GuildMessageReactions,
		IntentsBitField.Flags.DirectMessages,
		IntentsBitField.Flags.DirectMessageReactions,
		IntentsBitField.Flags.MessageContent,
	],
});

const commands = new Map<string, Command>();
const manager = new RaidManager();

container.register(kClient, { useValue: client });
container.register(kRaids, { useValue: manager });

for await (const dir of readdirp('./commands', { fileFilter: '*.js' })) {
	const commandMod = (await import(dir.fullPath)) as { default: Constructor<Command> };
	const command = container.resolve(commandMod.default);

	const name = basename(dir.fullPath, '.js');
	commands.set(name, command);

	logger.info(`Registered command: ${dir.basename}`);
}
container.register(kCommands, { useValue: commands });

for await (const dir of readdirp('./events', { fileFilter: '*.js' })) {
	const eventMod = (await import(dir.fullPath)) as { default: Constructor<Event> };
	const event = container.resolve(eventMod.default);

	client.on(event.event as keyof ClientEvents, async (...args: unknown[]) => event.run(...args));
	logger.info(`Registered event: ${event.name}`);
}

await client.login();

type Constructor<T> = new (...args: any[]) => T;

client.on('error', (error) => logger.error(error));
