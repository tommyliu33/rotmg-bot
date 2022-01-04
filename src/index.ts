import 'reflect-metadata';

import 'dotenv/config';
import 'module-alias/register';

import { Bot, RaidManager } from './struct';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import type { Event, Command } from '@struct'; // eslint-disable-line no-duplicate-imports

import readdirp from 'readdirp';
import Bree from 'bree';

import { container } from 'tsyringe';
import { kClient, kCommands, kPrisma, kRedis, kRaids, kBree } from './tokens';

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_HOST);
const client = new Bot();
const prisma = new PrismaClient();
const commands = new Map<string, Command>();

const bree = new Bree({ root: false, logger });

container.register(kRedis, { useValue: redis });
container.register(kBree, { useValue: bree });
container.register(kClient, { useValue: client });
container.register(kCommands, { useValue: commands });

async function init() {
	await prisma.$connect();
	container.register(kPrisma, { useValue: prisma });

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

		logger.info(`Registering event: ${event.name}`);

		client.on(event.name, (...args: unknown[]) => event.execute(...args));
	}

	await client.login();
}

void init();
