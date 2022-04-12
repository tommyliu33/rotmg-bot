import { guilds } from '../../util/mongo';

export async function getGuildSetting<K extends keyof Settings>(guildId: string, key: K) {
	const data = await guilds.findOne({ guild_id: guildId });

	let data_ = data![key] as OtherSettings | CategorySettings;
	if (key === 'other') {
		data_ = data_ as OtherSettings;
		return {
			// tickets_category_id: string;
			// logs: {
			// 	// store under one log channel with threads?
			// 	// webhooks?
			// 	// user updates events?
			// 	reaction_log_channel_id: string;
			// 	afk_check_log_channel_id: string;
			// 	headcount_log_channel_id: string;
			// 	voice_log_channel_id: string;
			// 	verification_log_channel_id: string;
			// };
			tickets_channel_id: data_.tickets_category_id,
		};
	}

	data_ = data_ as CategorySettings;
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

// TODO: refactor

export interface Settings {
	main: CategorySettings<false>;
	veteran: CategorySettings<true>;
	other: OtherSettings;
}

interface CategorySettings<Veteran extends boolean = boolean> {
	category_id: string;
	afk_check_channel_id: string;
	verification_channel_id: string;
	control_panel_channel_id: string;
	voice_channel_ids: string[];
	// TODO: unify under type
	verification_requirements?: Veteran extends true
		? {
				verification_message?: string;
				verification_message_id?: string;
				verification_button_id?: string;
				dungeon_completions?: number[];
		  }
		: {
				min_rank?: number;
				min_chars?: number;
				min_fame?: number;
				hidden_location?: boolean;
				verification_message?: string;
				verification_message_id?: string;
				verification_button_id?: string;
		  };
	user_role: string;
	leader_role: string;
}

interface OtherSettings {
	tickets_category_id: string;
	logs: {
		// store under one log channel with threads?
		// webhooks?
		// user updates events?
		reaction_log_channel_id: string;
		afk_check_log_channel_id: string;
		headcount_log_channel_id: string;
		voice_log_channel_id: string;
		verification_log_channel_id: string;
	};
	moderation: {
		cases: unknown[]; // setup type
		mod_log_channel_id: string;
	};
}
