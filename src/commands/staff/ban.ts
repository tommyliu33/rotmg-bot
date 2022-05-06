import type { Command } from '#struct/Command';
import { ChatInputCommandInteraction, GuildMember, User } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

export default class implements Command {
	public name = 'ban';
	public description = 'Ban a member';
	public options = [
		{
			name: 'member',
			description: 'The member for this action',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this action',
			type: 3,
			required: false,
		},
		{
			name: 'days',
			description: 'The number of days to delete messages for',
			type: 4,
			required: false,
			min_value: 0,
			max_value: 7,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });

		let target: GuildMember | User | null = interaction.options.getUser('member');
		const reason = interaction.options.getString('reason', false);
		const days = interaction.options.getInteger('days', false) ?? 0;

		const moderator = interaction.member;

		if (target instanceof User) {
			try {
				target = await interaction.guild.members.fetch(target.id);
			} catch {}
		}

		if (
			target instanceof GuildMember &&
			moderator.user.id !== interaction.guild.ownerId &&
			moderator.roles.highest.position <= target.roles.highest.position
		) {
			await interaction.editReply('You cannot do that.');
			return;
		}

		await createCase({
			action: ModLogAction.Ban,
			moderator,
			target: target!,
			reason,
			deleteMessageDays: days,
		});

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		await interaction.editReply(`${target instanceof GuildMember ? target.user.tag : target?.tag} was banned.`);
	}
}
