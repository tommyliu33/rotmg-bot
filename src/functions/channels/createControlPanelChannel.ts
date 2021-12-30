import type { Guild, OverwriteResolvable, TextChannel } from 'discord.js';
import { getGuildSetting, SettingsKey } from '../settings/getGuildSetting';

export async function createControlPanelChannel(guild: Guild, name: string, veteran: boolean): Promise<TextChannel> {
	const guildId = guild.id;

	const parentId = await getGuildSetting(guildId, veteran ? SettingsKey.VetSection : SettingsKey.MainSection);

	const permissionOverwrites: OverwriteResolvable[] = [];

	const leaderRoleId = await getGuildSetting(guildId, SettingsKey.RaidLeaderRole);
	permissionOverwrites.push({
		id: leaderRoleId,
		allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
	});

	if (veteran) {
		const vetLeaderRoleId = await getGuildSetting(guildId, SettingsKey.VetRaidLeaderRole);
		permissionOverwrites.push({
			id: vetLeaderRoleId,
			allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
		});
	}

	const channel = await guild.channels
		.create(name, {
			type: 'GUILD_TEXT',
			parent: parentId,
			permissionOverwrites,
		})
		.catch(() => undefined);

	return channel as TextChannel;
}
