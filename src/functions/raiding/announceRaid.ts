import { EmbedBuilder } from '@discordjs/builders';

import type { TextChannel } from 'discord.js';
import templite from 'templite';
import type { PartialRaid } from './startRaid';

import type { Discord } from '#components/Discord';

export function announceRaid(this: { discord: Discord }, raidInfo: Omit<PartialRaid, 'mainMessageId'>) {
	const { dungeon } = raidInfo;

	const channel = this.discord.client.channels.cache.get(raidInfo.textChannelId) as TextChannel;
	const member = channel.guild.members.cache.get(raidInfo.memberId)!;

	const embed = new EmbedBuilder()
		.setColor(dungeon.color)
		.setTimestamp()
		.setThumbnail(dungeon.images[Math.floor(Math.random() * dungeon.images.length)])
		.setAuthor({
			name: `${dungeon.name} started by ${member.displayName}`,
			iconURL: member.displayAvatarURL(),
		});

	const desc = templite(
		`
	A {{dungeon_name}} headcount has been started by {{raid_leader}}.
	React with {{dungeon_portal}} if you plan to join.
	React with {{dungeon_key}} if you have a key.
	Otherwise react with your role, gear, and class choices below.
	`,
		{
			dungeon_name: dungeon.name,
			raid_leader: member.displayName,
			dungeon_portal: dungeon.portal,
			dungeon_key: dungeon.keys.map((k) => k.emoji).join(''),
		}
	);

	embed.setDescription(desc);
	return channel.send({ embeds: [embed] });
}
