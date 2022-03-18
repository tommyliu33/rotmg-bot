import type { Event } from '../../struct/Event';
import { ButtonBuilder, Client, GuildEmoji, Interaction, ButtonComponent } from 'discord.js';
import type { RaidManager } from '../../struct/RaidManager';

import { Events, ComponentType } from 'discord.js';

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

	public async run(interaction: Interaction) {
		if (!interaction.inCachedGuild() || !interaction.isButton()) return;

		const raidKey = this.manager.afkchecks.findKey(
			(raid) => raid.textChannelId === interaction.channelId && raid.messageId === interaction.message.id
		);
		if (!raidKey) return;

		const raid = this.manager.afkchecks.get(raidKey)!;

		await interaction.deferReply({ ephemeral: true });

		const rows = interaction.message.components;
		const row = rows.find((row) => row.components.find((button) => button instanceof ButtonComponent));

		let index = -1;
		let button: ButtonComponent;
		let reactedEmoji: GuildEmoji;

		for (let i = 0; i < row!.components.length; ++i) {
			const component = row!.components[i];
			if (component.type === ComponentType.Button) {
				button = component;

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
			reacted?.add(interaction.user.id);

			// @ts-expect-error
			this.manager.afkchecks.set(raidKey, { ...raid, reactions });
			if (reacted!.size > (emojiRule.max ?? 0) && index !== -1) {
				// @ts-expect-error
				const button_ = new ButtonBuilder(button.data).setDisabled(true);
				// @ts-expect-error
				row!.components[index] = button_.toJSON();

				await interaction.message.edit({ components: [row!] });
			}
		}
		await interaction.editReply('.');

		console.log(this.manager.afkchecks.get(raidKey));
	}
}
