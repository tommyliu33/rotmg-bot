import type { Event } from '../struct/Event';
import { Events } from 'discord.js';

import { logger } from '../util/logger';

export default class implements Event {
	public name = 'Client ready';
	public event = Events.ClientReady;

	public async run() {
		if (process.argv.includes('--deploy')) await import('../util/deploy');

		logger.info('Logged in');
	}
}
