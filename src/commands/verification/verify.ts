import type { ChatInputCommandInteraction, ModalActionRowComponent } from 'discord.js';

import { ActionRow, Modal, TextInputComponent, TextInputStyle } from 'discord.js';
import type { Command } from '../../struct/Command';

export default class implements Command {
	public name = 'verify';
	public description = 'verify yourself';
	public options = [];

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		const modal = new Modal().setTitle(`${interaction.guild.name} Verification`).setCustomId('verification_modal');

		const nameForm = new TextInputComponent()
			.setCustomId('name')
			.setLabel('What is your ingame name?')
			.setStyle(TextInputStyle.Short);

		const rows = [nameForm].map((component) => new ActionRow<ModalActionRowComponent>().addComponents(component));
		modal.addComponents(...rows);

		await interaction.showModal(modal);
	}
}
