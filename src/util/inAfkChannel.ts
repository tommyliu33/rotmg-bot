import { getGuildSetting, SettingsKey } from '@functions';
import type { BaseCommandInteraction } from 'discord.js';

export async function inAfkChannel(interaction: BaseCommandInteraction) {
	if (!interaction.inCachedGuild()) return;

	const channels = [
		await getGuildSetting(interaction.guildId, SettingsKey.AfkCheck),
		await getGuildSetting(interaction.guildId, SettingsKey.VetAfkCheck),
	];

	console.log(channels);
	console.log(interaction.channelId);

	// eslint-disable-next-line @typescript-eslint/prefer-includes
	if (channels.indexOf(interaction.channelId) === -1) {
		throw new Error('This command can only be used in an afk check channel.');
	}
}
