import { EmbedBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import { paginate } from '#functions/paginate';
import type { Command } from '#struct/Command';
import { createUser, users } from '#util/mongo';

export default class implements Command {
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

		const doc = await createUser(u.id);
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

			const res = await users.updateOne({ user_id: u.id }, { $set: doc });
			if (res.acknowledged) {
				await interaction.editReply('Note added.');
			} else {
				await interaction.editReply('Failed to add note.');
			}
		}
	}

	private async view(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true, fetchReply: true });
		const u = interaction.options.getUser('user', true);

		const doc = await createUser(u.id);
		const guild = doc.guilds.find((user) => user.guild_id === interaction.guildId && user.notes?.length);

		if (!guild?.notes?.length || guild.notes.length === 0) {
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
