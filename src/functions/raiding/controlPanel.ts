import { getBento } from '@ayanaware/bento';
import { EmbedBuilder } from '@discordjs/builders';
import { ThreadChannel, ChannelType } from 'discord.js';
import { PartialRaid, RaidType } from './startRaid';
import { Discord } from '../../components/Discord';
import { afkCheckButtons, generateActionRows, headCountButtons } from '#util/components';

const emojis = [
	['🛑', '❌'],
	['📝', '🗺️', '🛑', '❌', '✅'],
];

const emojiLabels = [
	['Abort', 'End'],
	['Change location', 'Reveal location', 'Abort', 'End', 'Finish'],
];

export async function setupControlPanelEmbed(channel: ThreadChannel, raidInfo: PartialRaid) {
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
				...emojis[raidInfo.raidType].map((e, i) => `${e} ${emojiLabels[raidInfo.raidType][i]}`),
			].join('\n')
		);

	const buttons = raidInfo.raidType === RaidType.Headcount ? headCountButtons : afkCheckButtons;
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

			return thread;
		}
	}

	return undefined;
}

interface ControlPanelThreadData {
	name: string;
}
