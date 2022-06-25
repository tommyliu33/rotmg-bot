import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import { config } from '../../util/config';

export default class implements Command {
	public name = 'manual_verify';
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
		{
			name: 'hidden',
			description: 'Hides command output',
			required: false,
			type: 5,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const { user_role_id } = config['main_raiding'];
		if (!user_role_id) {
			await interaction.editReply('No role found.');
			return;
		}

		const member = interaction.options.getMember('member');
		const name = interaction.options.getString('name', true);
		const role = await interaction.guild.roles.fetch(user_role_id).catch(() => undefined);

		if (!role) {
			await interaction.editReply(`Could not find role in the server (it is currently set to: ${user_role_id}).`);
			return;
		}

		if (!member?.manageable) {
			await interaction.editReply('I cannot manage this user.');
			return;
		}

		verifyMember(member, {
			nickname: name,
			roleId: role.id,
			type: VerificationType.Main,
		})
			.then(async () => {
				await interaction.editReply(`Successfully verified ${member.toString()}.`);
			})
			.catch(async (err: Error) => {
				await interaction.editReply(err.message);
			});
	}
}
