import type { ChatInputCommandInteraction } from 'discord.js';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command {
	public name = 'verify';
	public description = 'verify yourself';
	public options = [];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const modal = new ModalBuilder()
			.setTitle(`${interaction.guild.name} Verification`)
			.setCustomId('verification_modal');
		const nameForm = new TextInputBuilder()
			.setCustomId('name')
			.setLabel('What is your ingame name?')
			.setStyle(TextInputStyle.Short);
		await interaction.showModal(modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameForm)));
	}
}
