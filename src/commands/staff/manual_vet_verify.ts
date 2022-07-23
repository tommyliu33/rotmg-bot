import { Inject } from '@ayanaware/bento';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '../../components/CommandEntity';

import { CommandManager } from '../../components/CommandManager';
import { Database } from '../../components/Database';
import { verifyMember } from '#functions/verification/verifyMember';

export default class implements CommandEntity {
	public name = 'commands:manual_vet_verify';
	public parent = CommandManager;

	@Inject(Database) private readonly database!: Database;
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const doc = await this.database.getGuild(interaction.guildId);
		const roleId = doc['veteran_raiding']['user_role_id'];

		const member = interaction.options.getMember('member');
		const role = await interaction.guild.roles.fetch(roleId).catch(() => undefined);

		if (!role) {
			await interaction.editReply('I could not find that role.');
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
