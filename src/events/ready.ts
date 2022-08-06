import { Events } from 'discord.js';
import type { Event } from '#struct/Event';
import { logger } from '#util/logger';

export default class implements Event {
	public name = 'Client ready';
	public event = Events.ClientReady;

	public run() {
		logger.info('Logged in');
	}
}
