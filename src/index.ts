import 'reflect-metadata';
import 'dotenv/config';

import { GatewayIntentBits } from 'discord-api-types/v10';
import { Client, ClientEvents } from 'discord.js';

import readdirp from 'readdirp';
import { container } from 'tsyringe';
import { kClient, kCommands, kDatabase, kModeration, kRaids, kBree } from './tokens';

import { logger } from './util/logger';

import type { Command } from '#struct/Command';
import { Database } from '#struct/Database';
import type { Event } from '#struct/Event';
import { RaidManager } from '#struct/RaidManager';
import { ModLogCaseHandler } from '#struct/ModLogCaseHandler';
import Bree from 'bree';

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
const modLog = container.resolve<ModLogCaseHandler>(ModLogCaseHandler);
container.register<ModLogCaseHandler>(kModeration, { useValue: modLog });

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
// @ts-expect-error
const bree = new Bree({ root: false, logger });
import { fileURLToPath } from 'node:url';
client.once('ready', () => {
	container.register(kBree, { useValue: bree });

	bree.add({
		// or make it more general
		name: 'suspensions',
		interval: '30s',
		path: fileURLToPath(new URL('./jobs/suspensions.js', import.meta.url)),
	});
	logger.info('registered job: suspensionsJob');

	bree.run('suspensions');
	logger.info('starting jobs');

	// TODO: cleanup
	bree.on('worker created', (name: string) => {
		logger.info('worker created:', name);
	});

	bree.on('worker deleted', (name: string) => {
		bree.workers.get(name)?.removeAllListeners();
	});

	// RECEIVE MESSAGE
	bree.workers.get('suspensions')?.on('error', (err) => logger.error(err));
});
await client.login();

type Constructor<T> = new (...args: any[]) => T;
