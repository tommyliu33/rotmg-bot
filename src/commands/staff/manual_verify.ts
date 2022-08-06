import { PrismaClient } from '@prisma/client';
import type { ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kPrisma } from '../../tokens';
import { verifyMember } from '#functions/verification/verifyMember';
import type { Command } from '#struct/Command';

@injectable()
export default class implements Command {
	public constructor(@inject(kPrisma) public readonly prisma: PrismaClient) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('hidden') ?? false });

		const doc = await this.prisma.guilds.findFirst({
			where: {
				guildId: interaction.guildId,
			},
		});
		const roleId = doc!.mainRaiding.userRoleId;

		const member = interaction.options.getMember('member');
		const name = interaction.options.getString('name', true);
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
