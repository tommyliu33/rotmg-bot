import type { ChatInputCommandInteraction } from 'discord.js';
import { config } from '../../util/config';
import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import type { Command } from '#struct/Command';

export default class implements Command {
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const { user_role_id } = config['veteran_raiding'];
		if (!user_role_id) {
			await interaction.editReply('No role found.');
			return;
		}

		const member = interaction.options.getMember('member');
		const role = await interaction.guild.roles.fetch(user_role_id).catch(() => undefined);

		if (!role) {
			await interaction.editReply('Could not find the role in this server.');
			return;
		}

		if (!member?.manageable) {
			await interaction.editReply('I cannot do that.');
			return;
		}

		verifyMember(member, {
			roleId: role.id,
			type: VerificationType.Veteran,
		})
			.then(async () => {
				await interaction.editReply('Done.');
			})
			.catch(async (err: Error) => {
				await interaction.editReply(err.message);
			});
	}
}
