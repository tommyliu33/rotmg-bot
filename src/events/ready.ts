import { type Client, Events } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient } from '../tokens';
import { logger } from '../util/logger';

import type { Event } from '#struct/Event';

@injectable()
export default class implements Event {
	public name = 'Client ready';
	public event = Events.ClientReady;

	public constructor(@inject(kClient) public readonly client: Client<true>) {}

	public async run() {
		if (process.argv.includes('--deploy')) await import('../util/deploy');

		logger.info('Logged in');
	}
}
