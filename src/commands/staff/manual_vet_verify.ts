import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import { config } from '../../util/config';

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
		{
			name: 'hidden',
			description: 'Hides command output',
			required: false,
			type: 5,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const { user_role_id } = config['veteran_raiding'];
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
			type: VerificationType.Veteran,
		})
			.then(async () => {
				await interaction.editReply(`Successfully veteran verified ${member.toString()}.`);
			})
			.catch(async (err: Error) => {
				await interaction.editReply(err.message);
			});
	}
}
