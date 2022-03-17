import { getGuildSetting } from '../functions/settings/getGuildSetting';

export async function inVeteranSection(guildId: string, channelId: string) {
	const veteran = await getGuildSetting(guildId, 'veteran');
	if (veteran.afkCheckChannelId === channelId) return true;
	if (veteran.controlPanelChannelId === channelId) return true;
	if (veteran.voiceChannelIds.includes(channelId)) return true;

	return false;
}
