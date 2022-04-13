import type { EmbedBuilder, Interaction } from 'discord.js';

import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateActionRows } from '#util/util';

const forwardButton = new ButtonBuilder().setCustomId('forward').setStyle(ButtonStyle.Success).setEmoji({
	name: '▶️',
});

const backButton = new ButtonBuilder().setCustomId('back').setStyle(ButtonStyle.Success).setEmoji({
	name: '◀️',
});

export async function paginate(interaction: Interaction, embeds: EmbedBuilder[]) {
	if (!interaction.inCachedGuild() || !interaction.isRepliable()) return;

	let page = 0;

	if (!interaction.deferred) await interaction.deferReply();

	const m = await interaction.editReply({
		embeds: [embeds[page]],
		components: generateActionRows(backButton, forwardButton),
	});

	const collector = m.createMessageComponentCollector({
		time: 60_000 * 5,
	});

	collector.on('collect', async (collectedInteraction) => {
		if (!collectedInteraction.isButton()) return;
		if (collectedInteraction.user.id !== interaction.user.id) {
			await collectedInteraction.reply({ content: "This button wasn't meant for you.", ephemeral: true });
			return;
		}

		await collectedInteraction.deferUpdate();

		if (collectedInteraction.customId === 'forward') {
			page > embeds.length - 1 ? (page = 0) : ++page;
		} else if (collectedInteraction.customId === 'back') {
			page < 0 ? (page = embeds.length - 1) : --page;
		}

		await collectedInteraction
			.editReply({
				embeds: [embeds[page]],
			})
			.catch(() => undefined);
	});

	collector.on('end', async () => {
		await interaction.editReply({ components: [] }).catch(() => undefined);
	});
}
