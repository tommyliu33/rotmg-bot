import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@ltd/j-toml';

export async function parseToml<T>(toml: string): Promise<T> {
	const file = await readFile(toml, { encoding: 'utf-8' });
	const contents = parse(file, 1.0, '\n', false);

	const json = JSON.parse(JSON.stringify(contents)) as T;
	return json;
}

export const config = await parseToml<GuildConfig>(resolve('../data/config.toml'));

export interface GuildConfig {
	guild_id: string;
	main_raiding: GuildConfigRaidSection & {
		verification_requirements: {
			hidden_location: boolean;
			minimum_characters: number;
			minimum_fame: number;
			minimum_rank: number;
		};
	};
	veteran_raiding: GuildConfigRaidSection & {
		verification_requirements: {
			dungeon_completions: number[];
		};
	};
}

interface GuildConfigRaidSection {
	category_id: string;
	control_panel_channel_id: string;
	status_channel_id: string;
	verification_channel_id: string;
	voice_channel_ids: string[];
	user_role_id: string;
	leader_role_id: string;
	verification_requirements: {
		verification_message: string;
	};
}

// export interface GuildConfig {
// 	guildId: string;
// 	mainRaiding: GuildConfigRaidSection & {
// 		verificationRequirements: {
// 			hiddenLocation: boolean;
// 			minimumChars: number;
// 			minimumFame: number;
// 			minimumRank: number;
// 		};
// 	};
// 	veteranRaiding: GuildConfigRaidSection & {
// 		verificationRequirements: {
// 			dungeonCompletions: number[];
// 		};
// 	};
// }

// interface GuildConfigRaidSection {
// 	categoryId: string;
// 	controlPanelChannelId: string;
// 	statusChannelId: string;
// 	verificationChannelId: string;
// 	voiceChannelIds: string[];
// 	userRoleId: string;
// 	leaderRoleId: string;
// 	verificationRequirements: {
// 		verificationMessage: string;
// 	};
// }
