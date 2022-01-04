import type { Guild, OverwriteResolvable, TextChannel } from 'discord.js';
import { getGuildSetting } from '../';

export async function createControlPanelChannel(guild: Guild, name: string, veteran: boolean): Promise<TextChannel> {
	const guildId = guild.id;

	const parentId = await getGuildSetting(guildId, veteran ? 'VetSection' : 'MainSection');

	const permissionOverwrites: OverwriteResolvable[] = [];

	const leaderRoleId = await getGuildSetting(guildId, 'RaidLeaderRole');
	permissionOverwrites.push({
		id: leaderRoleId,
		allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
	});

	if (veteran) {
		const vetLeaderRoleId = await getGuildSetting(guildId, 'VetRaidLeaderRole');
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
