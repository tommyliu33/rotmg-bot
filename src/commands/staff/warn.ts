import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

export default class implements Command {
	public name = 'warn';
	public description = 'Warn a member';
	public options = [
		{
			name: 'member',
			description: 'Member to warn',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'Reason for warning',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const reason = interaction.options.getString('reason', false) ?? 'No reason provided';

		const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });
		const moderator = interaction.member;

		let target = interaction.options.getMember('member');
		if (!target) {
			const userId = interaction.options.getUser('member', true);
			target = await interaction.guild.members.fetch({ user: userId }).catch(async () => {
				await interaction.editReply('Could not fetch member from the server.');
				return null;
			});
		}

		if (!target) return;

		if (target.user.bot) {
			await interaction.editReply('Cannot warn a bot.');
			return;
		}

		if (
			moderator.user.id !== interaction.guild.ownerId &&
			moderator.roles.highest.position <= target.roles.highest.position
		) {
			await interaction.editReply('You cannot do that.');
			return;
		}

		await createCase({
			action: ModLogAction.Warn,
			moderator,
			target,
			reason,
		});

		await interaction.editReply(`${target.user.tag} was warned.`);
	}
}
