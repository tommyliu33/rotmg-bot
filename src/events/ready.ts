import type { Event } from '../struct/Event';
import { type Client, Events } from 'discord.js';

import { logger } from '../util/logger';
import { guilds } from '../util/mongo';

import { injectable, inject } from 'tsyringe';
import { kClient } from '../tokens';
import { BASE_GUILD_DOC } from '../constants';

@injectable()
export default class implements Event {
	public name = 'Client ready';
	public event = Events.ClientReady;

	public constructor(@inject(kClient) public readonly client: Client<true>) {}

	public async run() {
		if (process.argv.includes('--deploy')) await import('../util/deploy');

		logger.info('Logged in');

		for (const guildId of this.client.guilds.cache.keys()) {
			const guild_ = await guilds.findOne({ guild_id: guildId });
			if (!guild_) {
				await guilds.insertOne(BASE_GUILD_DOC(guildId));
				logger.info(`Created guild document for ${guildId}`);
			}
		}
	}
}
