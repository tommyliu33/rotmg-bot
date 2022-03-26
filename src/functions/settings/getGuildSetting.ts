import { guilds } from '../../util/mongo';

export async function getGuildSetting<K extends keyof Settings>(
	guildId: string,
	key: K,
	subKey?: keyof Settings['main']
) {
	const data = await guilds.findOne({ guild_id: guildId });

	const data_ = data![key];

	if (!subKey) {
		return {
			categoryId: data_.category_id,
			afkCheckChannelId: data_.afk_check_channel_id,
			verificationChannelId: data_.verification_channel_id,
			controlPanelChannelId: data_.control_panel_channel_id,
			voiceChannelIds: data_.voice_channel_ids,
			verificationRequirements: data_.verification_requirements,
			userRole: data_.user_role,
			leaderRole: data_.leader_role,
		};
	}

	return data_[subKey];
}

export interface Settings {
	main: CategorySettings;
	veteran: CategorySettings;
}

// TODO: implement as type, if veteran then this property exists
interface CategorySettings {
	category_id: string;
	afk_check_channel_id: string;
	verification_channel_id: string;
	control_panel_channel_id: string;
	voice_channel_ids: string[];
	verification_requirements?: {
		min_rank?: number;
		min_chars?: number;
		min_fame?: number;
		hidden_location?: boolean;
		verification_message?: string;
	};
	user_role: string;
	leader_role: string;
}
