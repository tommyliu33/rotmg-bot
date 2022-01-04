import { getGuildSetting } from '../functions';

export async function inVetChannel(guildId: string, channelId: string): Promise<boolean> {
	const vetChannelId = await getGuildSetting(guildId, 'VetAfkCheck');
	return channelId === vetChannelId;
}
