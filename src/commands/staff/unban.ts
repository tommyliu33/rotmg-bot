import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { createCase, ModLogAction } from '#functions/moderation/createCase';

export default class implements Command {
	public name = 'unban';
	public description = 'Unban a user';
	public options = [
		{
			name: 'user',
			description: 'The user for this action',
			type: 6,
			required: true,
		},
		{
			name: 'reason',
			description: 'The reason for this action',
			type: 3,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });

		const target = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason', false);

		await interaction.guild.bans.fetch(target.id).catch(() => {
			throw new Error('This user is not banned.');
		});

		await createCase({
			action: ModLogAction.Unban,
			moderator: interaction.member,
			target,
			reason,
		});

		await interaction.editReply(`${target.tag} was unbanned.`);
	}
}
