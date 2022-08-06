import { EmbedBuilder } from '@discordjs/builders';
import { PrismaClient } from '@prisma/client';
import type { ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kPrisma } from '../../tokens';
import { paginate } from '#functions/paginate';

@injectable()
export default class implements CommandEntity {
	public constructor(@inject(kPrisma) public readonly prisma: PrismaClient) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		switch (interaction.options.getSubcommand(true)) {
			case 'create':
				await this.create(interaction);
				break;
			case 'view':
				await this.view(interaction);
				break;
		}
	}

	private async create(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });

		const u = interaction.options.getUser('user', true);
		const message = interaction.options.getString('message', true);

		const doc = await this.prisma.users.findFirst({ where: { user_id: u.id } });
		const guildIndex = doc.guilds.findIndex((g) => g.guild_id === interaction.guildId);

		if (guildIndex !== -1 && doc.guilds[guildIndex]) {
			const guildStats = doc.guilds[guildIndex];
			const obj = {
				author: interaction.user.tag,
				message,
				timestamp: Date.now(),
			};

			guildStats.notes ??= [];
			guildStats.notes.push(obj);

			doc.guilds[guildIndex] = guildStats;

			// const res = await this.prisma.users.({ user_id: u.id }, { $set: doc });
			await this.prisma.users.update({
				where: {
					id: doc!.id,
				},
				data: {
					guilds: doc?.guilds,
				},
				select: {},
			});
			// if (res.acknowledged) {
			// 	await interaction.editReply('Note added.');
			// } else {
			// 	await interaction.editReply('Failed to add note.');
			// }
		}
	}

	private async view(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });
		const u = interaction.options.getUser('user', true);

		const doc = await this.prisma.users.findFirstOrThrow({ where: { userId: u.id } });
		const guild = doc.guilds.find((user) => user.guild_id === interaction.guildId && user.notes.length);

		if (!guild.notes.length || guild.notes.length === 0) {
			await interaction.editReply('No notes found.');
			return;
		}

		const embeds = [];
		for (const { author, message, timestamp } of guild.notes) {
			const embed = new EmbedBuilder().setAuthor({ name: author }).setDescription(message).setTimestamp(timestamp);
			embeds.push(embed);
		}

		await paginate(interaction, embeds);
	}
}
