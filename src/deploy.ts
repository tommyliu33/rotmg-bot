import 'reflect-metadata';

import process from 'node:process';
import { REST, Routes } from 'discord.js';
import { PingCommand } from './interactions/index.js';
import { logger } from '#util/logger';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

const applicationId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

void (async () => {
	try {
		if (!applicationId || !guildId) {
			logger.warn('Missing env variables APPLICATION_ID and GUILD_ID');
			return;
		}

		await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
			body: [PingCommand],
		});

		logger.info('Deployed application (/) commands to guild');
	} catch (error_) {
		const error = error_ as Error;
		logger.error(error.stack, 'Failed to refresh application (/) commands');
	}
})();
