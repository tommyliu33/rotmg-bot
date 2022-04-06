import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { nanoid } from 'nanoid';

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
		{
			name: 'slient',
			description: "Doesn't tell the member who warned them",
			type: 5,
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		// TODO: setup role to execute and permissions

		const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });

		let member = interaction.options.getMember('member');
		if (!member) {
			const userId = interaction.options.getUser('member', true);
			member = await interaction.guild.members.fetch({ user: userId });
		}

		const reason = interaction.options.getString('reason', false) ?? 'No reason provided';
		const slient = interaction.options.getBoolean('slient', false) ?? false;
	}
}
