import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

export default class implements Command {
	public name = 'warn';
	public description = 'Warn a member';
	public options = [
		{
			name: 'member',
			description: 'The member to warn',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this warning',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });

		const user = interaction.options.getUser('member', true);
		const reason = interaction.options.getString('reason', false);

		try {
			await interaction.guild.members.fetch({ user });
		} catch {
			throw new Error('This user is not in the server.');
		}

		const target = interaction.options.getMember('member')!;
		if (target.user.bot) {
			await interaction.editReply('Cannot warn a bot.');
			return;
		}

		if (
			interaction.member.user.id !== interaction.guild.ownerId &&
			interaction.member.roles.highest.position <= target.roles.highest.position
		) {
			await interaction.editReply('You cannot do that.');
			return;
		}

		await createCase({
			action: ModLogAction.Warn,
			moderator: interaction.member,
			target,
			reason,
		});

		await interaction.editReply(`${target.user.tag} was warned.`);
	}
}
