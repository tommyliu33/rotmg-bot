import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';
import ms from 'ms';

export default class implements Command {
	public name = 'suspend';
	public description = 'Suspend a member in this server.';
	public options = [
		{
			name: 'member',
			description: 'The member to suspend',
			type: 6,
			required: true,
		},
		{
			name: 'duration',
			description: 'The duration of the suspension',
			type: 3,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this suspension',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser('member', true);
		const duration = interaction.options.getString('duration', true);
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
			action: ModLogAction.Suspend,
			moderator: interaction.member,
			target,
			reason,
			duration: ms(duration),
			roles: target.roles.cache.filter((r) => r.id !== r.guild.id).map((role) => role.id),
		});

		await interaction.editReply(`${target.user.tag} was suspended for ${duration}.`);
	}
}
