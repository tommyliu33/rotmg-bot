import { ObjectId } from 'mongodb';
import { guilds } from '../../util/mongo';

async function createGuildDocument(guildId: string) {
	const base = {
		_id: new ObjectId(),
		guild_id: guildId,
		main_section: {
			id: '',
			afk_check_channel_id: '',
			verification_channel_id: '',
			control_panel_channel_id: '',
			voice_channel_ids: [],
			user_role: '',
			leader_role: '',
		},
		veteran_section: {
			id: '',
			afk_check_channel_id: '',
			verification_channel_id: '',
			control_panel_channel_id: '',
			voice_channel_ids: [],
			user_role: '',
			leader_role: '',
		},
	};

	await guilds.insertOne(base);
	return base;
}

export async function getGuildSetting<K extends keyof Settings, T = undefined>(
	guildId: string,
	key: K,
	defaultValue?: T
) {
	const data = (await guilds.findOne({ guild_id: guildId })) ?? (await createGuildDocument(guildId));

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (data[key]) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		return data[key] ?? defaultValue;
	}

	return defaultValue!;
}

export async function setGuildSetting<K extends keyof Settings>(guildId: string, key: K, value: unknown) {
	const data = await guilds.findOne({ guild_id: guildId });

	if (key in data!) {
		// @ts-expect-error
		data[key] = value;

		await guilds.updateOne({ guild_id: guildId }, { $set: data! });

		return data;
	}

	console.log('data', data);
	console.log('key', key);

	return null;
}

export interface Settings {
	main_section: SectionSettings;
	veteran_section: SectionSettings;
}

interface SectionSettings {
	category_id: string;
	afk_check_channel_id: string;
	verification_channel_id: string;
	voice_channel_ids: string[];
}
