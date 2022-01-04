import { getGuildSetting } from '../functions';

export async function inAfkChannel(guildId: string, channelId: string) {
	const channels = [await getGuildSetting(guildId, 'AfkCheck'), await getGuildSetting(guildId, 'VetAfkCheck')];

	// eslint-disable-next-line @typescript-eslint/prefer-includes
	if (channels.indexOf(channelId) === -1) {
		throw new Error('This command can only be used in an afk check channel.');
	}
}
