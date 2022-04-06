import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { getGuildSetting } from '../../functions/settings/getGuildSetting';

export default class implements Command {
	public name = 'manual_vet_verify';
	public description = 'Manually veteran verify a member';
	public options = [
		{
			name: 'member',
			description: 'The member to verify',
			required: true,
			type: 6,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		const { userRole } = await getGuildSetting(interaction.guildId, 'veteran');

		if (!userRole) {
			await interaction.editReply('There is no set role in the database.');
			return;
		}

		const member = interaction.options.getMember('member');
		const role = await interaction.guild.roles.fetch(userRole).catch(() => undefined);

		if (!role) {
			await interaction.editReply(`Could not find role in the server (${userRole}).`);
			return;
		}

		if (member) {
			if (!member.manageable) {
				await interaction.editReply('I cannot add the role to this user.');
				return;
			}

			try {
				await member.roles.add(role);
			} catch {}

			await interaction.editReply('Done. If they did not receive the role, please add it manually.');
		}
	}
}
