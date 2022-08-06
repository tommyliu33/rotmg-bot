import {
	BaseInteraction,
	ButtonBuilder,
	ButtonComponent,
	ButtonStyle,
	Collection,
	ComponentType,
	Events,
	parseEmoji,
} from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kRaids } from '../../tokens';
import {
	isReaction,
	hasReactedState,
	removeReaction,
	addReaction,
	getReaction,
} from '#functions/raiding/afkcheck/reactions';
import { RaidType, type Raid } from '#functions/raiding/startRaid';
import type { Event } from '#struct/Event';
import type { RaidManager } from '#struct/RaidManager';
import { generateActionRows } from '#util/components';

@injectable()
export default class implements Event {
	public name = 'Guilds afk-check command handling';
	public event = Events.InteractionCreate;

	public constructor(@inject(kRaids) public readonly raidManager: RaidManager) {}

	public async run(interaction: BaseInteraction) {
		if (!interaction.inCachedGuild() || !interaction.isButton()) return;

		const raidKey = this.raidManager.raids.findKey(
			(raid) =>
				raid.textChannelId === interaction.channelId &&
				raid.mainMessageId === interaction.message.id &&
				raid.raidType === RaidType.Afkcheck
		);
		if (!raidKey) return;

		const raid = this.raidManager.raids.get(raidKey)!;
		const reply = await interaction.deferReply({ fetchReply: true, ephemeral: true });

		const button = interaction.message.resolveComponent(interaction.customId) as ButtonComponent | undefined;
		if (!button) {
			await interaction.editReply('An error occured trying to process your action.');
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
			this.raidManager.raids.set(raidKey, raid_);

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
			await removeReaction(raid_, emojiId, userId, 'pending');
			await interaction.editReply('Your original reaction was dismissed, re-react to start confirmation.');
			return;
		}

		addReaction(raid_, emojiId, userId, 'pending');

		const yesKey = 'yes';
		const noKey = 'no';

		const yesButton = new ButtonBuilder().setCustomId(yesKey).setLabel('Yes').setStyle(ButtonStyle.Success);
		const noButton = new ButtonBuilder().setCustomId(noKey).setLabel('No').setStyle(ButtonStyle.Secondary);

		await interaction.editReply({
			content: `Are you sure you want to confirm ${emojiId}?\nYou must bring it to this run.`,
			components: generateActionRows([yesButton, noButton]),
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
				await interaction.editReply({
					content: 'You failed to react in time.\nYou may dismiss this message.',
					components: [],
				});
				removeReaction(raid_, emojiId, userId, 'pending');
				return undefined;
			});

		if (collectedInteraction?.customId === yesKey) {
			addReaction(raid_, emojiId, userId, 'confirmed');
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: `You confirmed bringing ${emojiId}.`, components: [] });
		} else if (collectedInteraction?.customId === noKey) {
			removeReaction(raid_, emojiId, userId, 'pending');
			await collectedInteraction.editReply({ content: 'You cancelled your reaction.', components: [] });
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
