import { type TextChannel, EmbedBuilder } from 'discord.js';
import templite from 'templite';
import type { PartialRaid } from './startRaid';

import type { Discord } from '#components/Discord';
import { generateButtonsFromEmoji, generateActionRows } from '#util/components';

const raidType = ['Headcount', 'Afkcheck'];

export function announceRaid(this: { discord: Discord }, raidInfo: Omit<PartialRaid, 'mainMessageId'>) {
	const { dungeon } = raidInfo;

	const channel = this.discord.client.channels.cache.get(raidInfo.textChannelId) as TextChannel;
	const member = channel.guild.members.cache.get(raidInfo.memberId)!;

	const desc = templite(
		`
	A {{dungeon_name}} {{raid_type}} has been started by {{raid_leader}}.
	React with {{dungeon_portal}} if you plan to join.
	React with {{dungeon_key}} if you have a key.
	Otherwise react with your role, gear, and class choices below.
	`,
		{
			dungeon_name: dungeon.name,
			raid_leader: member.displayName,
			dungeon_portal: dungeon.portal,
			dungeon_key: dungeon.keys.map((k) => k.emoji).join(''),
			raid_type: raidType[raidInfo.raidType],
		}
	);

	const embed = new EmbedBuilder()
		.setColor(dungeon.color)
		.setTimestamp()
		.setThumbnail(dungeon.images[Math.floor(Math.random() * dungeon.images.length)])
		.setAuthor({
			name: `${dungeon.name} started by ${member.displayName}`,
			iconURL: member.displayAvatarURL(),
		})
		.setDescription(desc);

	const emojis = [
		{
			emoji: dungeon.portal,
		},
		...dungeon.keys,
		...dungeon.main,
	];

	const buttons = generateButtonsFromEmoji(
		emojis.map((reaction) => ({
			emoji: reaction.emoji.split(':')[2].slice(0, -1),
		}))
	);
	return channel.send({ embeds: [embed], components: generateActionRows(buttons) });
}
