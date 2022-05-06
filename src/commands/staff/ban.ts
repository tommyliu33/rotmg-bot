import type { Command } from '#struct/Command';
import { type ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

const isMember = (what: unknown): what is GuildMember => what instanceof GuildMember;

export default class implements Command {
	public name = 'ban';
	public description = 'Ban a member';
	public options = [
		{
			name: 'member',
			description: 'The member for this ban',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this ban',
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

		const target = interaction.options.getMember('member') ?? interaction.options.getUser('member');
		const reason = interaction.options.getString('reason', false);
		const days = interaction.options.getInteger('days', false) ?? 0;

		if (
			isMember(target) &&
			interaction.member.user.id !== interaction.guild.ownerId &&
			interaction.member.roles.highest.position <= target.roles.highest.position
		) {
			await interaction.editReply('You cannot do that.');
			return;
		}

		await createCase({
			action: ModLogAction.Ban,
			moderator: interaction.member,
			target: target!,
			reason,
			deleteMessageDays: days,
		});

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		await interaction.editReply(`${isMember(target) ? target.user.tag : target!.tag} was banned.`);
	}
}
