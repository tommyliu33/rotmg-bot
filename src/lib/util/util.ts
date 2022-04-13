import { chunk } from '@sapphire/utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, MessageActionRowComponentBuilder } from 'discord.js';
import { nanoid } from 'nanoid';
import { container } from 'tsyringe';
import { kClient, kDatabase } from '../../tokens';
import type { Database } from '#struct/Database';
import type { EmojiReaction } from '#struct/RaidManager';

// #region Raiding utils

export async function isVeteranSection(guildId: string, what: string) {
	const db = container.resolve<Database>(kDatabase);
	const settings = await db.getSection(guildId, 'veteran');

	if (settings.statusChannelId === what) return true;
	if (settings.controlPanelChannelId === what) return true;
	if ((settings.voiceChannelIds as unknown as string[]).includes(what)) return true;
	if (settings.verificationChannelId === what) return true;

	return false;
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
export function generateActionRows<Component extends MessageActionRowComponentBuilder>(...components: Component[]) {
	const chunks = chunk(components, 5);
	const rows = chunks.map((chunk) => new ActionRowBuilder<Component>().addComponents(...chunk));

	return rows;
}

// #endregion

// #pragma General util
export function random<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

export type CamelCaseKeys<T> = {
	/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types */
	[K in keyof T as CamelCase<string & K>]: T[K] extends {} ? CamelCaseKeys<T[K]> : T[K];
	/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types */
};
// #endregion
