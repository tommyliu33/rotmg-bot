import { Inject } from '@ayanaware/bento';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '#components/CommandEntity';

import { CommandManager } from '#components/CommandManager';
import { Database } from '#components/Database';
import { verifyMember } from '#functions/verification/verifyMember';

export default class implements CommandEntity {
	public name = 'commands:manual_verify';
	public parent = CommandManager;

	@Inject(Database) private readonly database!: Database;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const doc = await this.database.get(interaction.guildId);
		const roleId = doc['main_raiding']['user_role_id'];

		const member = interaction.options.getMember('member');
		const name = interaction.options.getString('name', true);
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
			nickname: name,
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
