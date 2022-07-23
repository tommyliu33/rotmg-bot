// @fs-entity
import { readFile } from 'node:fs/promises';
import { Component, ComponentAPI, Inject, Subscribe } from '@ayanaware/bento';
import Toml from '@iarna/toml';
import { Collection, Events, BaseInteraction, ComponentType, GuildEmoji, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Discord } from './Discord';
import { addReaction, getReaction, hasReacted, removeReaction } from '#functions/raiding/afkcheck/reactions';

import { Raid, RaidType } from '#functions/raiding/startRaid';
import { generateActionRows } from '#util/components';
import { logger } from '#util/logger';

export class RaidManager implements Component {
	public name = 'Raid manager';
	public api!: ComponentAPI;

	@Inject(Discord) private readonly discord!: Discord;

	public readonly raids: Collection<string, Raid> = new Collection();
	public readonly dungeons: Map<string, Dungeon> = new Map();
	public readonly emojis: Map<string, string> = new Map();

	public async onVerify() {
		await this.mapEmojis();
		return this.loadDungeonData();
	}

	private async mapEmojis() {
		const file = await readFile('../data/emojis.toml', { encoding: 'utf-8' });

		const file_ = Toml.parse(file);
		for (const emojis of Object.values(file_)) {
			const emojis_ = emojis as Record<string, string>;
			for (const [emojiName, emojiId] of Object.entries(emojis_)) this.emojis.set(emojiName, emojiId);
		}

		console.log(this.emojis);
	}

	private resolveEmoji(emojiName: string): string {
		const emojiId = this.emojis.get(emojiName);

		if (emojiId || emojiName) {
			const guildEmoji =
				this.discord.client.emojis.cache.find((emoji) => emoji.name === emojiName) ??
				this.discord.client.emojis.cache.get(emojiId!);

			if (guildEmoji) {
				return `<:${guildEmoji.name!}:${guildEmoji.id}>`;
			}
		}

		return '';
	}

	private async loadDungeonData() {
		const file = await readFile('../data/dungeons.toml', { encoding: 'utf-8' });
		const file_ = Toml.parse(file);

		for (const [key, dungeon] of Object.entries(file_)) {
			const dungeon_ = dungeon as unknown as Dungeon;

			const portal = this.resolveEmoji(dungeon_.portal);
			const keys = dungeon_.keys.map(({ emoji, max }) => ({
				emoji: this.resolveEmoji(emoji),
				max: max,
			}));
			const main = dungeon_.main.map(({ emoji, max }) => ({
				emoji: this.resolveEmoji(emoji),
				max: max,
			}));

			this.dungeons.set(key, { ...dungeon_, portal, keys, main, color: Number(dungeon_.color) });
		}

		logger.info('Cached dungeon data');
	}

	@Subscribe(Discord, Events.InteractionCreate)
	private async handleInteractionCreate(interaction: BaseInteraction) {
		if (!interaction.inCachedGuild() || !interaction.isButton()) return;
		const raidKey = this.raids.findKey(
			(raid) =>
				raid.textChannelId === interaction.channelId && raid.controlPanelThreadMessageId === interaction.message.id
		);
		if (!raidKey) return;

		const raid = this.raids.get(raidKey)!;
		if (raid.raidType !== RaidType.Afkcheck) return;

		const reply = await interaction.deferReply({ fetchReply: true, ephemeral: true });

		const { components } = reply;
		const row = components.find((row) => row.components.find((comp) => comp.type === ComponentType.Button));

		let index = -1;
		let clickedEmoji: GuildEmoji | undefined;

		for (let i = 0; i < row!.components.length; ++i) {
			const component = row!.components[i];
			if (component.type === ComponentType.Button && component.customId === interaction.customId) {
				const emoji = this.discord.client.emojis.cache.get(component.emoji!.id!);
				if (!emoji) continue;

				clickedEmoji = emoji;
				index = i;
				break;
			}
		}

		if (!clickedEmoji) return;

		const raid_ = raid as Raid<true>;
		const { dungeon } = raid;

		const emojiRule = dungeon.keys.find((key) => key.emoji === clickedEmoji?.id);
		if (!emojiRule) return;

		if (!raid_.reactions.has(emojiRule.emoji)) {
			raid_.reactions.set(emojiRule.emoji, { pending: new Set(), confirmed: new Set() });
		}

		const emojiId = emojiRule.emoji;
		const userId = interaction.user.id;

		if (hasReacted(raid_, emojiId, userId, 'confirmed')) {
			await interaction.editReply('You already confirmed your reaction.');
			return;
		}

		addReaction(raid_, emojiId, userId, 'pending');

		const yesKey = 'yes';
		const cancelKey = 'cancel';

		const yesButton = new ButtonBuilder().setCustomId(yesKey).setLabel('Yes').setStyle(ButtonStyle.Primary);
		const cancelButton = new ButtonBuilder().setCustomId(cancelKey).setLabel('Cancel').setStyle(ButtonStyle.Danger);

		await interaction.editReply({
			content: 'Click yes/cancel to confirm/cancel.',
			components: generateActionRows([yesButton, cancelButton]),
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
				removeReaction(raid_, emojiId, userId, 'pending');
				return undefined;
			});

		if (collectedInteraction?.customId === yesKey) {
			addReaction(raid_, emojiId, userId, 'confirmed');
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'Confirmed.', components: [] });
		} else if (collectedInteraction?.customId === cancelKey) {
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'Cancelled.', components: [] });
		}

		if (getReaction(raid_, emojiId, 'confirmed').size + 1 > emojiRule.max) {
			let i = 0;
			const buttons = [];
			for (const comp of row!.components) {
				if (comp.type === ComponentType.Button) {
					const button = new ButtonBuilder(comp.data);
					if (i === index) button.setDisabled(true);
					buttons.push(button);

					++i;
				}
			}

			await interaction.message.edit({ components: generateActionRows(buttons) });
		}
	}
}

export interface Dungeon {
	name: string;
	portal: string;
	keys: EmojiReaction[];

	main: EmojiReaction[];
	optional?: EmojiReaction[];

	color: number;
	images: string[];
}

export interface EmojiReaction {
	emoji: string;
	max: number;
}
