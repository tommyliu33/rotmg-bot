import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

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
			choices: [
				{ name: '0d', value: 0 },
				{ name: '1d', value: 1 },
				{ name: '2d', value: 2 },
				{ name: '3d', value: 3 },
				{ name: '4d', value: 4 },
				{ name: '5d', value: 5 },
				{ name: '6d', value: 6 },
				{ name: '7d', value: 7 },
			],
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });

		const reason = interaction.options.getString('reason', false) ?? 'No reason provided';
		const days = interaction.options.getInteger('days', false) ?? 0;
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
			await interaction.editReply('Cannot ban a bot.');
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
			action: ModLogAction.Ban,
			moderator,
			target,
			reason,
			deleteMessageDays: days,
		});

		await interaction.editReply(`${target.user.tag} was banned.`);
	}
}
