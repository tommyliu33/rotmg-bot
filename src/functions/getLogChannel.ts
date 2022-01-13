import { container } from 'tsyringe';
import { kClient } from '../tokens';

import { getGuildSetting } from '../functions';
import { isTextChannel } from '@sapphire/discord.js-utilities';

import type { Client } from 'discord.js';

export async function getLogChannel(guildId: string) {
	const client = container.resolve<Client<true>>(kClient);

	const guild = await client.guilds.fetch(guildId).catch(() => undefined);
	if (!guild) return;

	const logChannelId = await getGuildSetting(guildId, 'LogChannel');

	const logChannel = await guild.channels.fetch(logChannelId).catch(() => undefined);
	if (isTextChannel(logChannel)) {
		return logChannel;
	}

	return null;
}
