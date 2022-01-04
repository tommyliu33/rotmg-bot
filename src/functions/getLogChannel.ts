import { container } from 'tsyringe';
import { kClient } from '../tokens';

import { getGuildSetting } from '../functions';
import { isTextChannel } from '@sapphire/discord.js-utilities';

import type { Bot } from '../struct/Bot';

export async function getLogChannel(guildId: string) {
	const client = container.resolve<Bot>(kClient);

	const guild = await client.guilds.fetch(guildId).catch(() => undefined);
	if (!guild) return;

	const logChannelId = await getGuildSetting(guildId, 'LogChannel');

	const logChannel = await guild.channels.fetch(logChannelId).catch(() => undefined);
	if (isTextChannel(logChannel)) {
		return logChannel;
	}

	return null;
}
