import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';
import { inject, injectable } from 'tsyringe';
import { kDatabase } from '../../tokens';
import { Database } from '#struct/Database';

import { VerificationType, verifyMember } from '#functions/verification/verifyMember';

@injectable()
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

	public constructor(@inject(kDatabase) public readonly db: Database) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const { userRoleId } = await this.db.getSection(interaction.guildId, 'veteran');

		if (!userRoleId) {
			await interaction.editReply('There is no set role in the database.');
			return;
		}

		const member = interaction.options.getMember('member');
		const name = interaction.options.getString('name', true);
		const role = await interaction.guild.roles.fetch(userRoleId).catch(() => undefined);

		if (!role) {
			await interaction.editReply(`Could not find role in the server (it is currently set to: ${userRoleId}).`);
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
