import { Bot, Event } from '../struct';

import { getInteractions } from '../util';
import { logger } from '../logger';

import { inject, injectable } from 'tsyringe';
import { kClient } from '../tokens';

import { registerJobs, startJobs } from '../jobs/index';

@injectable()
export default class implements Event {
	public name = 'ready';

	public constructor(@inject(kClient) public readonly client: Bot) {}

	public async execute() {
		logger.info('Logged in');
		if (process.argv.includes('--update')) {
			const app = await this.client.application?.fetch();
			const guilds = await this.client.guilds.fetch();

			for (const guild of guilds.values()) {
				await app?.commands.set(getInteractions(), guild.id);

				logger.info(`Updated (/) commands for ${guild.name} (${guild.id})`);
			}
		}

		registerJobs();
		startJobs();
	}
}
