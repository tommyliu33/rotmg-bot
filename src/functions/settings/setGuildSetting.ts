import { guilds } from '../../util/mongo';

import type { Settings } from './getGuildSetting';
export async function setGuildSetting<K extends keyof Settings>(guildId: string, key: K, value: unknown) {
	const data = await guilds.findOne({ guild_id: guildId });

	console.log('data', data);
	console.log('key', key);

	if (key in data!) {
		// @ts-expect-error
		data[key] = value;

		await guilds.updateOne({ guild_id: guildId }, { $set: data! });

		return true;
	}

	return false;
}
