import { getBento } from '@ayanaware/bento';
import { EmbedBuilder, ButtonBuilder } from '@discordjs/builders';
import { ButtonStyle, ChannelType, ThreadChannel } from 'discord.js';
import type { PartialRaid } from './startRaid';
import { Discord } from '../../components/Discord';
import { generateActionRows } from '#util/util';

const emojis = {
	'📝': 'Change location',
	'🗺️': 'Reveal location',
	'🛑': 'Abort',
	'❌': 'End',
	'✅': 'Finish',
};

function setupControlPanelEmbed(channel: ThreadChannel, raidInfo: PartialRaid) {
	const member = channel.guild.members.cache.get(raidInfo.memberId)!;

	const embed = new EmbedBuilder()
		.setAuthor({
			name: `Control panel for ${member.displayName}`,
			iconURL: member.displayAvatarURL(),
		})
		.setTimestamp()
		.setDescription(
			[
				'For any available action, click the corresponding button below',
				'',
				'📝 Change location',
				'🗺️ Reveal location',
				'🛑 Abort',
				'❌ End',
				'✅ Finish',
			].join('\n')
		);

	const buttons = Object.keys(emojis).map((emoji, i) =>
		new ButtonBuilder().setEmoji({ name: emoji }).setCustomId(i.toString()).setStyle(ButtonStyle.Primary)
	);
	return channel.send({ embeds: [embed], components: generateActionRows(buttons) });
}

export async function setupControlPanel(raidInfo: PartialRaid, data?: ControlPanelThreadData) {
	const discord = getBento().getComponent(Discord);

	const guild = await discord.client.guilds.fetch(raidInfo.guildId).catch(() => undefined);
	if (guild) {
		const channel = await guild.channels.fetch(raidInfo.controlPanelId).catch(() => undefined);
		if (channel?.type === ChannelType.GuildText) {
			const thread = await channel.threads.create({
				name: data?.name ?? 'Control panel',
			});

			const message = await setupControlPanelEmbed(thread, raidInfo);
			return { message, thread };
		}
	}

	return undefined;
}

interface ControlPanelThreadData {
	name: string;
}
