import { container } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type { Database } from '#struct/Database';

import { UnsafeEmbedBuilder } from 'discord.js';
import { bold, inlineCode } from '@discordjs/builders';

import { ModLogAction, ModLogCase } from './createCase';
import { transformCase } from './transformCase';

export async function logCase(case_: ModLogCase) {
	const db = container.resolve<Database>(kDatabase);

	const guildId = case_.moderator.guild.id;
	const doc = await db.guilds?.findUnique({ where: { guildId } });
	if (doc) {
		const cases = doc.moderation.cases.push(transformCase(case_));

		await db.guilds?.update({
			where: { guildId },
			data: {
				moderation: {
					update: {
						cases: doc.moderation.cases,
					},
				},
			},
		});

		const logChannelId = doc.moderation.logChannelId;
		if (logChannelId) {
			const channel = await case_.moderator.guild.channels.fetch(logChannelId).catch(() => undefined);
			if (!(channel instanceof Map) && channel?.isText()) {
				const embed = new UnsafeEmbedBuilder()
					.setThumbnail(case_.target.displayAvatarURL())
					.setDescription(
						`
					${bold('Action:')} ${ModLogAction[case_.action]}
					${bold('Moderator:')} ${case_.moderator.toString()} (${inlineCode(case_.moderator.id)})
					${bold('Target:')} ${case_.target.toString()} (${inlineCode(case_.target.id)})
					${bold('Reason:')} ${case_.reason}
					`
					)
					.setTimestamp()
					.setFooter({ text: `Case #${cases}` });

				await channel.send({ embeds: [embed] });
			}
		}
	}
}
