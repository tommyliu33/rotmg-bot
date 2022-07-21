import 'dotenv/config';

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

import { REST } from '@discordjs/rest';
import { Routes, DataResolver } from 'discord.js';
import Toml from '@iarna/toml';

import createLogger from 'pino';

const logger = createLogger();

async function run() {
	const emojis = await readdir('./data/emojis');
	const emojiPaths = emojis.map((emoji) => resolve('./data/emojis', emoji));

	const rest = new REST({ headers: { 'Content-Type': 'application/json' } }).setToken(process.env.DISCORD_TOKEN);

	try {
		for (const path of emojiPaths) {
			const body = { image: await DataResolver.resolveImage(path), name: basename(path, '.png'), roles: [] };
			await rest.post(Routes.guildEmojis(process.env.GUILD_ID), { body });
		}

		const guildEmojis = await rest.get(Routes.guildEmojis('884659225224175626'));
		const emojiFile = await readFile('./data/emojis.toml', 'utf-8');

		const emojiFileContents = Toml.parse(emojiFile);
		const newEmojiFile = {};

		// the [table]
		for (const i in emojiFileContents) {
			newEmojiFile[i] ??= {};
			// the key
			for (const j in emojiFileContents[i]) {
				const emoji = guildEmojis.find((e) => e.name === j);
				if (emoji) {
					newEmojiFile[i][j] = emoji.id;
				} else {
					logger.warn(`Missing emoji id for ${j}, skipping`);
				}
			}
		}

		await writeFile('./data/emojis.toml', Toml.stringify(newEmojiFile), 'utf-8');
		logger.info('Successfully setup guild emojis');
	} catch (e) {
		logger.error(e, 'Failed to setup guild emojis');
	}

	rest.setToken(null);
	rest.removeAllListeners();
}

if (process.env.DISCORD_TOKEN && process.env.GUILD_ID) {
	await run();
} else {
	logger.error('No DISCORD_TOKEN or GUILD_ID provided');
}
