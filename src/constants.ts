import { ObjectId } from 'mongodb';

// #region Database

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
// #endregion

// #region Emojis

export const WARRIOR_EMOJI_ID = '930900284413194240' as const;
export const PALADIN_EMOJI_ID = '930900392110358579' as const;
export const KNIGHT_EMOJI_ID = '930900421084606565' as const;
export const TRICKSTER_EMOJI_ID = '930900321914486796' as const;
export const FUNGAL_TOME_EMOJI_ID = '886328344126300221' as const;
export const CURSE_EMOJI_ID = '954244972394209282' as const;
export const ARMOR_BREAK_EMOJI_ID = '886328650562162740' as const;
export const SLOW_EMOJI_ID = '930900333859840002' as const;
export const EXPOSE_EMOJI_ID = '954244760820940811' as const;

export const FAME_EMOJI_ID = '952444390809423943' as const;
// #endregion
