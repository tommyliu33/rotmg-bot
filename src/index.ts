import 'reflect-metadata';
import 'dotenv/config';

import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client, ClientEvents } from 'discord.js';

import readdirp from 'readdirp';
import { container } from 'tsyringe';
import { kClient, kCommands, kDatabase, kRaids } from './tokens';

import { logger } from './util/logger';

// import './util/mongo';

import type { Command } from '#struct/Command';
import type { Event } from '#struct/Event';
import { Database } from '#struct/Database';
import { RaidManager } from '#struct/RaidManager';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.MessageContent,
	],
});

const commands = new Map<string, Command>();
const manager = new RaidManager();

container.register(kClient, { useValue: client });
container.register(kRaids, { useValue: manager });

const db = container.resolve<Database>(Database);
await db.start();

container.register<Database>(kDatabase, { useValue: db });

for await (const dir of readdirp('./commands', { fileFilter: '*.js' })) {
	const commandMod = (await import(dir.fullPath)) as { default: Constructor<Command> };
	const command = container.resolve(commandMod.default);

	commands.set(command.name, command);
	logger.info(`Registered command: ${command.name}`);
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
