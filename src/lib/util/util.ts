import { chunk } from '@sapphire/utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, MessageActionRowComponentBuilder } from 'discord.js';
import { nanoid } from 'nanoid';
import { container } from 'tsyringe';
import { kClient } from '../../tokens';
import { getGuildSetting } from '#functions/settings/getGuildSetting';
import type { EmojiReaction } from '#struct/RaidManager';

// #region Raiding utils

export async function isVeteranSection(guildId: string, what: string) {
	const settings = await getGuildSetting(guildId, 'veteran');
	if (settings.afkCheckChannelId === what) return true;
	if (settings.controlPanelChannelId === what) return true;
	if (settings.voiceChannelIds.includes(what)) return true;
	if (settings.verificationChannelId === what) return true;

	return true;
}

// #endregion

// #region Message components

export function generateButtonsFromEmojis(emojis: EmojiReaction[]): ButtonBuilder[] {
	const client = container.resolve<Client>(kClient);
	const buttons: ButtonBuilder[] = [];
	for (const { emoji } of emojis) {
		const button = new ButtonBuilder().setCustomId(nanoid()).setStyle(ButtonStyle.Primary);
		if (/\p{Emoji_Presentation}/gu.test(emoji)) {
			button.setEmoji({ name: emoji });
		} else if (client instanceof Client && client.emojis.cache.has(emoji)) {
			button.setEmoji({ id: emoji });
		}

		buttons.push(button);
	}

	return buttons;
}

// Copyright © 2020 The Sapphire Community and its contributors
export function generateActionRows<Component extends MessageActionRowComponentBuilder>(components: Component[]) {
	const chunks = chunk(components, 5);
	const rows = chunks.map((chunk) => new ActionRowBuilder<Component>().addComponents(...chunk));

	return rows;
}

// #endregion

// #pragma General util
export function random<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}
// #endregion
