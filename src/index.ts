import 'reflect-metadata';
import 'dotenv/config';

import { container } from 'tsyringe';
import { kClient, kRaids, kCommands } from './tokens';

import { Client } from 'discord.js';
import { ClientIntents } from './util/constants';
import { RaidManager } from './struct/RaidManager';

import { resolve } from 'node:path';
import { loadCommands } from './util/commands';
import { loadEvents } from './util/events';

import './util/mongo';

const client = new Client({
	intents: ClientIntents,
});
const manager = new RaidManager();

container.register(kClient, { useValue: client });
container.register(kRaids, { useValue: manager });

const commands = await loadCommands(resolve('./commands'));
container.register(kCommands, { useValue: commands });
await loadEvents(resolve('./events'));

await client.login();

import { scrapePlayer } from 'realmeye-scrape';

client.on('messageCreate', async (msg) => {
	if (msg.author.id !== '') return;

	const roleId = '';

	const member = await msg.member?.fetch();
	if (msg.content === 'role add') {
		await member?.roles.add(roleId);
		console.log('added');
		return;
	}

	if (msg.content === 'role remove') {
		await member?.roles.remove(roleId);
		console.log('removed');
	}

	const args = msg.content.split(/ +/);
	const command = args[0];
	if (command === 'test') {
		const name = args[1];
		const res = await scrapePlayer(name);
		console.log('res', res);
	}
});

client.on('error', (error) => console.log('error', error));
