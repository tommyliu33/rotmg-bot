import { ObjectId } from 'mongodb';

export const BASE_GUILD_DOC = (guildId: string) => ({
	_id: new ObjectId(),
	guild_id: guildId,
	main: {
		category_id: '',
		afk_check_channel_id: '',
		verification_channel_id: '',
		control_panel_channel_id: '',
		voice_channel_ids: [],
		user_role: '',
		leader_role: '',
	},
	veteran: {
		category_id: '',
		afk_check_channel_id: '',
		verification_channel_id: '',
		control_panel_channel_id: '',
		voice_channel_ids: [],
		user_role: '',
		leader_role: '',
	},
});

export const FAME_EMOJI_ID = '952444390809423943'