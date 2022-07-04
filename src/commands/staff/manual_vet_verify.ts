import type { ChatInputCommandInteraction } from 'discord.js';
import { verifyMember } from '#functions/verification/verifyMember';
import type { Command } from '#struct/Command';
import { guilds } from '#util/mongo';

export default class implements Command {
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const doc = await guilds.findOne({ guild_id: interaction.guildId });
		const roleId = doc?.['veteran_raiding']['user_role_id'] ?? undefined;

		if (!roleId) {
			await interaction.editReply('No role found.');
			return;
		}

		const member = interaction.options.getMember('member');
		const role = await interaction.guild.roles.fetch(roleId).catch(() => undefined);

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
		})
			.then(async () => {
				await interaction.editReply('Done.');
			})
			.catch(async (err: Error) => {
				await interaction.editReply(err.message);
			});
	}
}
