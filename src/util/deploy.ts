import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import readdirp from 'readdirp';

import type { Command } from '../Command';
import type { Class } from 'type-fest';

import { logger } from './logger';

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN!);
const commands = [];

for await (const dir of readdirp('./commands')) {
	const mod = (await import(dir.fullPath)) as { default: Class<Command> };
	const command = new mod.default();

	// TODO: defaultPermission
	commands.push({
		name: command.name,
		description: command.description,
		options: command.options ?? [],
	});
}

try {
	await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), { body: commands });

	logger.info(`Sucessfully deployed interaction commands for target guild (${process.env.GUILD_ID!})`);
} catch (e) {
	logger.error(e, `Failed to deploy interaction commands for target guild (${process.env.GUILD_ID!})`);
}
