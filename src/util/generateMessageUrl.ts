export const generateMessageUrl = (guildId: string, channelId: string, messageId: string) =>
	`https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
