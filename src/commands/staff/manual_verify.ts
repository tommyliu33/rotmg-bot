import type { ChatInputCommandInteraction } from 'discord.js';
import { config } from '../../util/config';
import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import type { Command } from '#struct/Command';

export default class implements Command {
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
