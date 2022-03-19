import type { Event } from '../../struct/Event';
import type { Client, GuildEmoji, Interaction } from 'discord.js';
import type { RaidManager } from '../../struct/RaidManager';

import { Events, ComponentType, ButtonBuilder, ButtonComponent, ActionRowBuilder } from 'discord.js';

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

		await interaction.deferReply({ ephemeral: true });

		const rows = interaction.message.components;
		const row = rows.find((row) => row.components.find((button) => button instanceof ButtonComponent));

		let index = -1;
		let reactedEmoji: GuildEmoji;

		for (let i = 0; i < row!.components.length; ++i) {
			const component = row!.components[i];
			if (component.type === ComponentType.Button) {
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
		if (!emojiRule) return console.log('No emoji rule');

		if (!reactions.has(emojiRule.emoji)) {
			reactions.set(emojiRule.emoji, new Set());
		}

		if (reactions.get(emojiRule.emoji)) {
			const reacted = reactions.get(emojiRule.emoji);
			if (reacted?.has(interaction.user.id)) {
				await interaction.editReply('you already reacted to this');
				return;
			}

			console.log('max is', emojiRule.max ?? 0);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (reacted!.size >= (Number(emojiRule.max) ?? 0) && index !== -1) {
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
				return;
			}

			reacted?.add(interaction.user.id);

			// @ts-expect-error
			this.manager.afkchecks.set(raidKey, { ...raid, reactions });
		}
		await interaction.editReply('.');
	}
}
