import type { Guild, OverwriteResolvable, VoiceChannel } from 'discord.js';
import { getGuildSetting, SettingsKey } from '../settings/getGuildSetting';

export async function createRaidChannel(guild: Guild, name: string, veteran: boolean): Promise<VoiceChannel> {
	const leaderId = await getGuildSetting(guild.id, SettingsKey.RaidLeaderRole);
	const parentId = await getGuildSetting(guild.id, veteran ? SettingsKey.VetSection : SettingsKey.MainSection);

	const permissionOverwrites: OverwriteResolvable[] = [
		{
			id: guild.id,
			allow: [],
			deny: ['CONNECT', 'SPEAK', 'VIEW_CHANNEL'],
		},
		{
			id: leaderId,
			allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'STREAM'],
		},
	];

	const channel = await guild.channels
		.create(name, {
			type: 'GUILD_VOICE',
			parent: parentId,
			permissionOverwrites,
			userLimit: 30,
		})
		.catch(() => undefined);

	return channel as VoiceChannel;
}
