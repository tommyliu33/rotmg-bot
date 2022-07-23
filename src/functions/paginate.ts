import type { EmbedBuilder, Interaction } from 'discord.js';

import { ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { generateActionRows } from '#util/components';

const forwardId = 'forward';
const forwardButton = new ButtonBuilder().setCustomId(forwardId).setStyle(ButtonStyle.Success).setLabel('>');

const backId = 'back';
const backButton = new ButtonBuilder().setCustomId(backId).setStyle(ButtonStyle.Success).setLabel('<');

export async function paginate(interaction: Interaction, embeds: EmbedBuilder[]) {
	if (!interaction.isRepliable()) return;

	let currentPage = 0;

	if (!interaction.deferred) {
		await interaction.deferReply();
	}

	const components = generateActionRows([backButton, forwardButton]);
	const m = await interaction.editReply({
		embeds: [embeds[currentPage]],
		components,
	});

	const collector = m.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => i.user.id === interaction.user.id,
		time: 60_000 * 5,
	});

	// https://github.com/DankMemer/sniper/blob/main/src/paginator.js
	collector.on('collect', async (collectedInteraction) => {
		switch (collectedInteraction.customId) {
			case backId:
				if (currentPage === 0) {
					await collectedInteraction.deferUpdate();
					return;
				}

				currentPage -= 1;
				await collectedInteraction.update({ embeds: [embeds[currentPage]] });
				break;
			case forwardId:
				if (currentPage === embeds.length - 1) {
					await collectedInteraction.deferUpdate();
					return;
				}
				currentPage += 1;
				await collectedInteraction.update({ embeds: [embeds[currentPage]] });
				break;
		}
	});

	collector.on('end', async () => {
		await interaction.editReply({ components: [] }).catch(() => undefined);
	});
}
