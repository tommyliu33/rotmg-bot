import type { Snowflake } from 'discord.js';

export const messageUrl = (guildId: Snowflake, channelId: Snowflake, messageId: Snowflake) =>
	`https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
