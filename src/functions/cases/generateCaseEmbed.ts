import { bold, Embed, inlineCode } from '@discordjs/builders';
import { Duration } from '@sapphire/time-utilities';
import { stripIndents } from 'common-tags';

import type { GuildMember } from 'discord.js';

export function generateCaseEmbed(staff: GuildMember, target: GuildMember, length: string, reason?: string) {
	return new Embed()
		.setColor(0x992d22)
		.setAuthor({
			name: staff.user.tag,
			iconURL: staff.user.displayAvatarURL({ dynamic: true }),
		})
		.setDescription(
			stripIndents`
		${bold('User')}: ${target.user.tag} (${inlineCode(target.id)})
		${bold('Reason')}: ${reason ?? 'no reason provided'}
	`
		)
		.setFooter({ text: 'Unsuspending at' })
		.setTimestamp(new Duration(length).dateFrom(new Date()));
}
