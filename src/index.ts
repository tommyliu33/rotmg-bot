import 'reflect-metadata';
import 'dotenv/config';

import { Client, Options } from 'discord.js';
import { RaidManager, Event, Command } from './struct';
import Prisma from '@prisma/client';
import { logger } from './logger';

import readdirp from 'readdirp';
import Bree from 'bree';

import { container } from 'tsyringe';
import { kClient, kCommands, kPrisma, kRedis, kRaids, kBree } from './tokens';

import Redis from 'ioredis';

const client = new Client({
	intents: [
		'GUILDS',
		'GUILD_MESSAGES',
		'GUILD_MEMBERS',
		'GUILD_VOICE_STATES',
		'GUILD_MESSAGE_REACTIONS',

		'DIRECT_MESSAGES',
		'DIRECT_MESSAGE_REACTIONS',
	],
	partials: ['CHANNEL', 'REACTION', 'GUILD_MEMBER', 'MESSAGE'],
	makeCache: Options.cacheWithLimits({
		GuildInviteManager: 0,
		GuildStickerManager: 0,
		PresenceManager: 0,
		StageInstanceManager: 0,
		ThreadManager: 0,
		ThreadMemberManager: 0,
	}),
});

const prisma = new Prisma.PrismaClient();
await prisma.$connect();

const redis = new Redis(process.env.REDIS_HOST);

const commands = new Map<string, Command>();

const bree = new Bree({ root: false, logger });

container.register(kPrisma, { useValue: prisma });
container.register(kRedis, { useValue: redis });
container.register(kBree, { useValue: bree });

container.register(kClient, { useValue: client });
container.register(kCommands, { useValue: commands });

container.register(kRaids, {
	useValue: container.resolve<RaidManager>(RaidManager),
});

for await (const { fullPath } of readdirp('./commands')) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const cmd = container.resolve<Command>((await import(fullPath)).default);

	logger.info(`Registering command: ${cmd.name}`);

	commands.set(cmd.name, cmd);
}

for await (const { fullPath } of readdirp('./events')) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const event = container.resolve<Event>((await import(fullPath)).default);

	if (event.emitter === 'raidManager') await event.execute();
	if (event.emitter === 'client') {
		client.on(event.name, async (...args: unknown[]) => event.execute(...args));
	}

	logger.info(`Registering event: ${event.name}`);
}

await client.login();
