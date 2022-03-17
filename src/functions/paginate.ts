import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Interaction, EmbedBuilder } from 'discord.js';

const forwardButton = new ButtonBuilder().setCustomId('forward').setStyle(ButtonStyle.Success).setEmoji({
	name: '▶️',
});

const backButton = new ButtonBuilder().setCustomId('back').setStyle(ButtonStyle.Success).setEmoji({
	name: '◀️',
});

export async function paginate(interaction: Interaction, embeds: EmbedBuilder[]) {
	if (!interaction.inCachedGuild() || !interaction.isRepliable()) return;

	let page = 0;

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, forwardButton);
	if (!interaction.deferred) await interaction.deferReply();

	const m = await interaction.editReply({
		embeds: [embeds[page]],
		components: [row],
	});

	const collector = m.createMessageComponentCollector({
		filter: (i) => ['backward', 'forward'].includes(i.customId) && i.user.id === interaction.user.id,
		time: 60000 * 5,
	});

	collector.on('collect', async (collectedInteraction) => {
		if (!collectedInteraction.isButton()) return;

		// TODO: fix
		await collectedInteraction.deferUpdate();
		if (collectedInteraction.customId === 'back') {
			page - 1 < embeds.length ? (page = 0) : --page;
		} else if (collectedInteraction.customId === 'forward') {
			page + 1 > embeds.length ? (page = 0) : ++page;
		}

		await collectedInteraction.editReply({
			embeds: [embeds[page]],
			components: [row],
		});
		collector.resetTimer();
	});

	collector.on('end', async () => {
		await interaction.editReply({ components: [] }).catch(() => undefined);
	});
}
