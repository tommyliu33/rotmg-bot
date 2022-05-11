import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

export default class implements Command {
	public name = 'unsuspend';
	public description = 'Unsuspend a member in this server.';
	public options = [
		{
			name: 'member',
			description: 'The member to unsuspend',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this unsuspension',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser('member', true);
		const reason = interaction.options.getString('reason', false);

		try {
			await interaction.guild.members.fetch({ user });
		} catch {
			throw new Error('This user is not in the server.');
		}

		const target = interaction.options.getMember('member')!;
		await createCase({
			action: ModLogAction.Unsuspend,
			moderator: interaction.member,
			target,
			reason,
			roles: target.roles.cache.map((role) => role.id),
		});

		await interaction.editReply(`${target.user.tag} was unsuspended.`);
	}
}
