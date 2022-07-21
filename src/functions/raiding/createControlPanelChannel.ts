import { getBento } from '@ayanaware/bento';
import { ChannelType } from 'discord.js';
import { Discord } from '../../components/Discord';

export async function createControlPanelChannel(guildId: string, channelId: string, data?: ControlPanelThreadData) {
	const discord = getBento().getComponent(Discord);

	const guild = await discord.client.guilds.fetch(guildId).catch(() => undefined);
	if (guild) {
		const channel = await guild.channels.fetch(channelId).catch(() => undefined);
		if (channel?.type === ChannelType.GuildText) {
			const thread = await channel.threads.create({
				name: data?.name ?? 'Control panel',
			});

			return thread;
		}
	}

	return undefined;
}

interface ControlPanelThreadData {
	name: string;
}
