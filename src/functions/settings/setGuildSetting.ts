import { guilds } from '../../util/mongo';

import type { Settings } from './getGuildSetting';
export async function setGuildSetting<K extends keyof Settings>(
	guildId: string,
	key: K,
	subKey: keyof Settings['main'],
	value: unknown
) {
	const data = await guilds.findOne({ guild_id: guildId });
	if (key in data!) {
		data![subKey] = value;
		await guilds.updateOne({ guild_id: guildId }, { $set: data! });
		return true;
	}

	return false;
}
