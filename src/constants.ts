// constant buttons for headcounts etc embeds

import { MessageActionRow, MessageButton } from 'discord.js';
import { nanoid } from 'nanoid';

export const zws = String.fromCharCode(8203);

export const controlPanelButtonEmojis: Readonly<string[]> = ['📝', '🗺️', '🛑', '❌'];

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Buttons {
	export const controlPanelButtons = new MessageActionRow().addComponents(
		controlPanelButtonEmojis.reduce<MessageButton[]>((row, emoji) => {
			row.push(new MessageButton().setEmoji(emoji).setCustomId(nanoid()).setStyle('PRIMARY'));
			return row;
		}, [])
	);
}
