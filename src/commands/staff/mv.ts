import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { getGuildSetting } from '../../functions/settings/getGuildSetting';

export default class implements Command {
	public name = 'mv';
	public description = 'Manually verify a member';
	public options = [
		{
			name: 'member',
			description: 'The member to verify',
			required: true,
			type: 6,
		},
		{
			name: 'name',
			description: 'Their ingame name',
			required: true,
			type: 3,
		},
	];

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply();

		const { userRole } = await getGuildSetting(interaction.guildId, 'main');

		if (!userRole) {
			await interaction.editReply('There is no set role in the database.');
			return;
		}

		const member = interaction.options.getMember('member');
		const name = interaction.options.getString('name', true);
		const role = await interaction.guild.roles.fetch(userRole).catch(() => undefined);

		if (!role) {
			await interaction.editReply(`Could not find role in the server (${userRole}).`);
			return;
		}

		if (member) {
			if (!member.manageable) {
				await interaction.editReply("I cannot add roles or update this user's nickname.");
				return;
			}

			try {
				await member.roles.add(role);
				await member.setNickname(name);
			} catch {}

			await interaction.editReply(
				'Done. If they did not receive the role or their nickname, please update it manually.'
			);
		}
	}
}
