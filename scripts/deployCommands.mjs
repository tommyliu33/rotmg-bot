import 'dotenv/config';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import createLogger from 'pino';
const logger = createLogger();

async function run() {
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);
	const commands = [];

	// for await (const dir of readdirp('./interactions', { fileFilter: '*.js' })) {
	// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	// 	const { name, description, options } = (await import(dir.fullPath)).default;
	// 	commands.push({ name, description, options });
	// }

	try {
		await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
		logger.info('Sucessfully refreshed application commands (/) for guild');
	} catch (e) {
		logger.error(e, 'Failed to refresh application commands (/) for guild');
	}
}

if (process.env.DISCORD_TOKEN && process.env.GUILD_ID) {
	await run();
} else {
	logger.error('No DISCORD_TOKEN or GUILD_ID provided');
}
