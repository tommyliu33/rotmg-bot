import { readFile } from 'node:fs/promises';
import { Component, ComponentAPI, Inject, Subscribe } from '@ayanaware/bento';
import Toml from '@iarna/toml';
import {
	Collection,
	Events,
	BaseInteraction,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	ButtonComponent,
	parseEmoji,
} from 'discord.js';
import { Discord } from './Discord';
import {
	addReaction,
	getReaction,
	hasReactedState,
	removeReaction,
	isReaction,
} from '#functions/raiding/afkcheck/reactions';

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
			(raid) => raid.textChannelId === interaction.channelId && raid.mainMessageId === interaction.message.id
		);
		if (!raidKey) return;

		const raid = this.raids.get(raidKey)!;
		if (raid.raidType !== RaidType.Afkcheck) return;

		const reply = await interaction.deferReply({ fetchReply: true, ephemeral: true });

		const button = interaction.message.resolveComponent(interaction.customId) as ButtonComponent | undefined;
		if (!button) {
			await interaction.editReply('An error occured trying to process your action. (1)');
			return;
		}

		const raid_ = raid as Raid<true>;
		const { dungeon } = raid;

		if (button.data.emoji?.id === parseEmoji(dungeon.portal)!.id) {
			if (raid_.users.has(interaction.user.id)) {
				await interaction.editReply('You are already in this run.');
				return;
			}

			raid_.users.add(interaction.user.id);
			this.raids.set(raidKey, raid_);

			await interaction.editReply('You joined this run.');
			return;
		}

		const keyReact = dungeon.keys.find((key) => parseEmoji(key.emoji)!.id === button.data.emoji?.id);
		if (!keyReact) {
			if (isReaction(raid_, button.data.emoji!.id!)) {
				await interaction.editReply(`You reacted to bringing a ${button.data.emoji!.name!}.`);
				return;
			}

			await interaction.editReply('An error occured trying to process your action.');
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!raid_.reactions) raid_.reactions = new Collection();
		if (!raid_.reactions.has(keyReact.emoji))
			raid_.reactions.set(keyReact.emoji, { pending: new Set(), confirmed: new Set() });

		const emojiId = keyReact.emoji;
		const userId = interaction.user.id;

		if (hasReactedState(raid_, emojiId, userId, 'confirmed')) {
			await interaction.editReply('You already confirmed your reaction.');
			return;
		} else if (hasReactedState(raid_, emojiId, userId, 'pending')) {
			// TODO: allow user to confirm / deny if they deleted the original followup message
			await interaction.editReply('I await your confirmation. If you dismissed the original message, react below.');
			return;
		}

		addReaction(raid_, emojiId, userId, 'pending');

		const yesKey = 'yes';
		const cancelKey = 'cancel';

		const yesButton = new ButtonBuilder().setCustomId(yesKey).setLabel('Yes').setStyle(ButtonStyle.Success);
		const cancelButton = new ButtonBuilder().setCustomId(cancelKey).setLabel('Cancel').setStyle(ButtonStyle.Secondary);

		await interaction.editReply({
			content: `Are you sure you want to confirm ${emojiId}?\nYou must bring it to this run.`,
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
					content: 'You failed to react in time, your reaction was dismissed.',
					components: [],
				});
				removeReaction(raid_, emojiId, userId, 'pending');
				return undefined;
			});

		if (collectedInteraction?.customId === yesKey) {
			addReaction(raid_, emojiId, userId, 'confirmed');
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: `You confirmed bringing ${emojiId}.`, components: [] });
		} else if (collectedInteraction?.customId === cancelKey) {
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'You clicked cancel.', components: [] });
		}

		if (getReaction(raid_, emojiId, 'confirmed').size + 1 > keyReact.max) {
			const { components } = interaction.message;
			const actionRowIndex = components.findIndex((row) => row.components.includes(button));
			const buttonIndex = components[actionRowIndex]!.components.findIndex(
				(component) => component.customId === interaction.customId
			);

			if (components[actionRowIndex].components[buttonIndex]) {
				// @ts-expect-error
				components[actionRowIndex].components[buttonIndex] = new ButtonBuilder(button.data).setDisabled(true);
				await interaction.message.edit({ components });
			}
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
