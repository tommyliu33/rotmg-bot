import type { ChatInputCommandInteraction } from 'discord.js';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { CommandEntity } from '#components/CommandEntity';
import { CommandManager } from '#components/CommandManager';

export default class implements CommandEntity {
	public name = 'commands:verify';
	public parent = CommandManager;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const modal = new ModalBuilder()
			.setTitle(`${interaction.guild.name} Verification`)
			.setCustomId('verification_modal');
		const nameForm = new TextInputBuilder()
			.setCustomId('name')
			.setLabel('Enter your ingame name below')
			.setStyle(TextInputStyle.Short);
		await interaction.showModal(modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameForm)));
	}
}
