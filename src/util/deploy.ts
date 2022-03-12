import { REST } from '@discordjs/rest';
import { Routes, APIApplicationCommand } from 'discord-api-types/v9';

import { logger } from './logger';

import { container } from 'tsyringe';
import { kCommands } from '../tokens';
import type { Command } from '../struct/Command';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
const commands = container.resolve<Map<string, Command>>(kCommands);

async function deploy() {
	if (commands.size === 0) {
		logger.warn('No slash commands to refresh');
		return;
	}

	const array = [...commands.values()];
	const payload = array.reduce<ApplicationCommand[]>((array, command) => {
		array.push({ name: command.name, description: command.description, options: command.options ?? [] });
		return array;
	}, []);

	try {
		await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), { body: payload });
		logger.info('Sucessfully refreshed slash commands for guild');
	} catch (e) {
		logger.error(e, 'Failed to refresh slash commands for guild');
	}
}

await deploy();

type ApplicationCommand = Pick<APIApplicationCommand, 'name' | 'description' | 'options'>;
