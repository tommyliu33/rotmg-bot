import readdirp from 'readdirp';
import { logger } from './logger';

import { container } from 'tsyringe';
import { kClient } from '../tokens';

import type { Client, ClientEvents } from 'discord.js';
import type { Constructor } from '@sapphire/utilities';
import type { Event } from '#struct/Event';

export async function loadEvents(directory: string) {
	const client = container.resolve<Client<true>>(kClient);
	const eventFiles = readdirp(directory, { fileFilter: '*.js' });

	for await (const dir of eventFiles) {
		const eventMod = (await import(dir.fullPath)) as { default: Constructor<Event> };
		const event = container.resolve(eventMod.default);

		client.on(event.event as keyof ClientEvents, async (...args: unknown[]) => event.run(...args));
		logger.info(`Registered event: ${event.name}`);
	}
}
