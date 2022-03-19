import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { EmbedBuilder } from 'discord.js';
import { hyperlink } from '@discordjs/builders';

export default class implements Command {
	public name = 'find';
	public description = 'Find a member with the target name';
	public options = [
		{
			type: 3,
			name: 'name',
			description: 'Name to lookup',
			required: true,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const m = await interaction.deferReply({ fetchReply: true });
		const name = interaction.options.getString('name', true);

		const members = await interaction.guild.members.fetch().catch(async () => {
			await interaction.editReply('Failed to fetch server members.');
			return undefined;
		});

		if (!members) return;

		// TODO:

		const embed = new EmbedBuilder();
		const members_ = members.filter((member) => member.displayName.toLowerCase().includes(name));
		if (members_.size > 1) {
			await interaction.editReply({ embeds: [embed.toJSON()] });
			return;
		}
	}
}
