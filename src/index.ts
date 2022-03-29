import 'reflect-metadata';
import 'dotenv/config';

import { container } from 'tsyringe';
import { kClient, kRaids, kCommands } from './tokens';

import { Client } from 'discord.js';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { RaidManager } from './struct/RaidManager';

import { loadCommands } from './util/commands';
import { loadEvents } from './util/events';

import './util/mongo';

const start = async () => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildVoiceStates,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.DirectMessageReactions,
			GatewayIntentBits.MessageContent,
		],
	});
	const manager = new RaidManager();

	container.register(kClient, { useValue: client });
	container.register(kRaids, { useValue: manager });

	const commands = await loadCommands('./commands');
	container.register(kCommands, { useValue: commands });

	await loadEvents('./events');

	await client.login();
};

void start();
