import { getGuildSetting } from '../functions/settings/getGuildSetting';

export async function inVeteranSection(guildId: string, channelId: string) {
	const veteran = await getGuildSetting(guildId, 'veteran');
	if (veteran.afk_check_channel_id === channelId) return true;
	if (veteran.control_panel_channel_id === channelId) return true;
	if (veteran.voice_channel_ids.includes(channelId)) return true;

	return false;
}
