import { getGuildSetting } from '../functions';
import { inVetChannel } from './inVetChannel';

export async function getVoiceChannels(guildId: string, channelId: string) {
	const isVet = await inVetChannel(guildId, channelId);

	if (isVet) return getGuildSetting(guildId, 'VetSectionVoiceChannels');

	return getGuildSetting(guildId, 'MainSectionVoiceChannels');
}
