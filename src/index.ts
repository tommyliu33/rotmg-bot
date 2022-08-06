import 'reflect-metadata';
import 'dotenv/config';

import { basename } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { Client, ClientEvents, GatewayIntentBits } from 'discord.js';
import readdirp from 'readdirp';
import { container, InjectionToken } from 'tsyringe';
import type { Command } from './struct/Command';
import { kClient, kCommands, kPrisma, kRaids } from './tokens';
import { logger } from './util/logger';
import type { Event } from '#struct/Event';
import { RaidManager } from '#struct/RaidManager';

const commands: Map<string, Command> = new Map();

void (async () => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildVoiceStates,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildEmojisAndStickers,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.DirectMessageReactions,
			GatewayIntentBits.MessageContent,
		],
	});
	await client.login();
	container.register(kClient, { useValue: client });

	const raidManager = container.resolve<RaidManager>(RaidManager);
	await raidManager.mapEmojis();
	await raidManager.loadDungeonData();

	const prisma = new PrismaClient();
	await prisma.$connect();

	container.register(kPrisma, { useValue: prisma });
	container.register(kRaids, { useValue: raidManager });
	container.register(kCommands, { useValue: commands });

	const commandFiles = readdirp(fileURLToPath(new URL('./commands', import.meta.url)), {
		fileFilter: '*.js',
	});
	for await (const file of commandFiles) {
		const commandMod = (await import(file.fullPath)) as { default: InjectionToken<Command> };
		const command = container.resolve(commandMod.default);

		const name = basename(file.basename, '.js');
		logger.info(`Registered command: ${name}`);
		commands.set(name, command);
	}

	const eventFiles = readdirp(fileURLToPath(new URL('./events', import.meta.url)), {
		fileFilter: '*.js',
	});
	for await (const file of eventFiles) {
		const eventMod = (await import(file.fullPath)) as { default: InjectionToken<Event> };
		const event = container.resolve(eventMod.default);

		client.on(event.event as keyof ClientEvents, (...args) => event.run(...args));
		logger.info(`Registered event: ${event.name}`);
	}
})();
