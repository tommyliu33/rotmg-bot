import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

const MINUTE = 60000;

export default class implements Command {
	public name = 'timeout';
	public description = 'Timeout a member';
	public options = [
		{
			name: 'member',
			description: 'The member to timeout',
			type: 6,
			required: true,
		},
		{
			name: 'duration',
			description: 'The duration of the timeout',
			type: 4,
			choices: [
				{ name: '1 minute', value: MINUTE },
				{ name: '5 minutes', value: 5 * MINUTE },
				{ name: '10 minutes', value: 10 * MINUTE },
				{ name: '1 hour', value: 60 * MINUTE },
				{ name: '6 hours', value: 6 * 60 * MINUTE },
				{ name: '12 hours', value: 12 * 60 * MINUTE },
				{ name: '1 day', value: 2 * 12 * 60 * MINUTE },
				{ name: '7 days', value: 7 * 12 * 60 * MINUTE },
			],
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this timeout',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser('member', true);
		const duration = interaction.options.getInteger('duration', true);
		const reason = interaction.options.getString('reason', false);

		try {
			await interaction.guild.members.fetch({ user });
		} catch {
			throw new Error('This user is not in the server.');
		}

		const target = interaction.options.getMember('member')!;
		if (
			interaction.member.user.id !== interaction.guild.ownerId &&
			interaction.member.roles.highest.position <= target.roles.highest.position
		) {
			await interaction.editReply('You cannot do that.');
			return;
		}

		await createCase({
			action: ModLogAction.Timeout,
			moderator: interaction.member,
			target,
			reason,
			duration,
		});

		await interaction.editReply(`${target.user.tag} was timed out.`);
	}
}
