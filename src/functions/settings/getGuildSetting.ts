import { guilds } from '../../util/mongo';

export async function getGuildSetting<K extends keyof Settings>(guildId: string, key: K) {
	const data = await guilds.findOne({ guild_id: guildId });
	return data![key] ?? undefined; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
}

export interface Settings {
	main: CategorySettings;
	veteran: CategorySettings;
}

interface CategorySettings {
	category_id: string;
	afk_check_channel_id: string;
	verification_channel_id: string;
	control_panel_channel_id: string;
	voice_channel_ids: string[];
	user_role: string;
	leader_role: string;
}
