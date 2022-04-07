import dotProp from 'dot-prop';
import type { Settings } from './getGuildSetting';
import { guilds } from '../../util/mongo';

const { set } = dotProp;

export async function setGuildSetting<K extends keyof Settings>(
	guildId: string,
	key: K,
	subKey: keyof Settings['main'],
	value: unknown
) {
	const data = await guilds.findOne({ guild_id: guildId });
	if (key in data!) {
		const data_ = set(data!, `${key}.${subKey}`, value);
		await guilds.updateOne({ guild_id: guildId }, { $set: data_ });
		return true;
	}

	return false;
}
