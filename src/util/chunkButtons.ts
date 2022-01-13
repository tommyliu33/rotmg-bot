import { MessageActionRow, MessageButton } from 'discord.js';
import type { Button } from '../dungeons';

export function chunkButtons(buttons: Button[][]): MessageActionRow[] {
	const rows: MessageActionRow[] = [];
	for (let i = 0; i < buttons.length; ++i) {
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let j = 0; j < buttons[i].length; ++j) {
			if (!rows[i]) rows[i] = new MessageActionRow();
			if (rows[i].components.length >= 5) rows.push(new MessageActionRow());
			rows[rows.length - 1].addComponents(new MessageButton(buttons[i][j]));
		}
	}

	return rows;
}
