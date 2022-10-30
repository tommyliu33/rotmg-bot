import { Client, type Events } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import type { Event } from '#struct/Event';
import { logger } from '#util/logger';
import { kClient } from '#util/tokens';

@injectable()
export default class implements Event<typeof Events.ClientReady> {
	public constructor(@inject(kClient) private readonly client: Client) {}

	public handle() {
		logger.info('Logged in');
	}
}
