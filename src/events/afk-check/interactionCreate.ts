import type { Event } from '../../struct/Event';
import type { Client, GuildEmoji, Interaction } from 'discord.js';
import type { RaidManager } from '../../struct/RaidManager';

import { Events, ComponentType, ButtonBuilder, ButtonStyle, ButtonComponent, ActionRowBuilder } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';

@injectable()
export default class implements Event {
	public name = 'Afk check interaction handling';
	public event = Events.InteractionCreate;

	public constructor(
		@inject(kClient) public readonly client: Client,
		@inject(kRaids) public readonly manager: RaidManager
	) {}

	public async run(interaction: Interaction<'cached'>) {
		if (!interaction.isButton()) return;

		const raidKey = this.manager.afkchecks.findKey(
			(raid) => raid.textChannelId === interaction.channelId && raid.messageId === interaction.message.id
		);
		if (!raidKey) return;

		const raid = this.manager.afkchecks.get(raidKey)!;

		const reply = await interaction.deferReply({ fetchReply: true, ephemeral: true });

		const rows = interaction.message.components;
		const row = rows.find((row) => row.components.find((button) => button instanceof ButtonComponent));

		let index = -1;
		let reactedEmoji: GuildEmoji;

		for (let i = 0; i < row!.components.length; ++i) {
			const component = row!.components[i];
			if (component.type === ComponentType.Button && component.customId === interaction.customId) {
				const emoji = this.client.emojis.cache.get(component.emoji!.id!);
				if (!emoji) continue;

				reactedEmoji = emoji;
				index = i;
				break;
			}
		}

		// @ts-expect-error
		if (!reactedEmoji) return; // eslint-disable-line @typescript-eslint/no-unnecessary-condition

		const { dungeon, reactions } = raid;
		const emojiRule = dungeon.keys.find((key) => key.emoji === reactedEmoji.id);
		if (!emojiRule) return;

		if (!reactions.has(emojiRule.emoji)) {
			reactions.set(emojiRule.emoji, { pending: new Set(), confirmed: new Set() });
		}

		const emojiId = emojiRule.emoji;
		const userId = interaction.user.id;

		if (raid.getReaction(emojiId, 'confirmed').has(userId)) {
			await interaction.editReply('You already confirmed your reaction.');
			return;
		}

		raid.addReaction(emojiId, userId, 'pending');

		const yesKey = 'yes';
		const cancelKey = 'cancel';

		const yesButton = new ButtonBuilder().setCustomId(yesKey).setLabel('Yes').setStyle(ButtonStyle.Primary);
		const cancelButton = new ButtonBuilder().setCustomId(cancelKey).setLabel('Cancel').setStyle(ButtonStyle.Danger);

		await interaction.editReply({
			content: 'Click yes/cancel to confirm/cancel.',
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(yesButton, cancelButton)],
		});
		const collectedInteraction = await reply
			.awaitMessageComponent({
				filter: async (i) => {
					await i.deferUpdate();
					return i.user.id === interaction.user.id;
				},
				componentType: ComponentType.Button,
				time: 60_000,
			})
			.catch(async () => {
				await collectedInteraction?.editReply({
					content: 'Timed out, your reaction was not confirmed.',
					components: [],
				});
				raid.removeReaction(emojiId, userId, 'pending');
				return undefined;
			});

		if (collectedInteraction?.customId === yesKey) {
			raid.addReaction(emojiId, userId, 'confirmed');
			raid.removeReaction(emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'Confirmed.', components: [] });
		} else if (collectedInteraction?.customId === cancelKey) {
			raid.removeReaction(emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'Cancelled.', components: [] });
		}

		if (raid.getReaction(emojiId, 'confirmed').size + 1 > emojiRule.max) {
			let i = 0;
			const buttons = [];
			for (const comp of row!.components) {
				if (comp instanceof ButtonComponent) {
					const button = new ButtonBuilder(comp.data);
					if (i === index) button.setDisabled(true);
					buttons.push(button);

					++i;
				}
			}

			const row_ = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
			await interaction.message.edit({ components: [row_] });
		}
	}
}
