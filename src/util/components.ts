import { chunkArray } from '@chatsift/utils';
import {
	ActionRowBuilder,
	AnyComponentBuilder,
	ButtonBuilder,
	ButtonStyle,
	normalizeArray,
	RestOrArray,
} from 'discord.js';
import { nanoid } from 'nanoid';

import type { EmojiReaction } from '#components/RaidManager';

export const PARTICIPATE_ID = 'participate' as const;
export const CHANGE_LOCATION_ID = 'change_location' as const;
export const REVEAL_LOCATION_ID = 'reveal_location' as const;
export const ABORT_ID = 'abort' as const;
export const END_ID = 'end' as const;
export const FINISH_ID = 'finish' as const;
export const DONE_ID = 'done' as const;
export const CANCEL_ID = 'cancel' as const;

function getBaseButton() {
	return new ButtonBuilder().setStyle(ButtonStyle.Primary);
}

export function generateActionRows<Component extends AnyComponentBuilder>(components: RestOrArray<Component>) {
	components = normalizeArray(components);

	const chunks = chunkArray(components, 5);
	const rows = chunks.map((chunk) => new ActionRowBuilder<Component>().addComponents(...chunk));

	return rows;
}

export function generateButtonsFromEmoji(reactions: Omit<EmojiReaction, 'max'>[]) {
	const buttons = [];
	for (const reaction of reactions) {
		const id = nanoid();
		buttons.push(new ButtonBuilder().setEmoji({ id: reaction.emoji }).setStyle(ButtonStyle.Primary).setCustomId(id));
	}

	return buttons;
}

export const participateButton = getBaseButton().setCustomId(PARTICIPATE_ID).setEmoji({
	name: '🤚',
});

export const changeLocationButton = getBaseButton().setCustomId(CHANGE_LOCATION_ID).setEmoji({
	name: '📝',
});

export const revealLocationButton = getBaseButton().setCustomId(REVEAL_LOCATION_ID).setEmoji({
	name: '🗺️',
});

export const abortButton = getBaseButton().setCustomId(ABORT_ID).setEmoji({
	name: '🛑',
});

export const endButton = getBaseButton().setCustomId(END_ID).setEmoji({
	name: '❌',
});

export const finishButton = getBaseButton().setCustomId(FINISH_ID).setEmoji({
	name: '✅',
});

export const doneButton = getBaseButton().setCustomId(DONE_ID).setLabel('Done');
export const cancelButton = getBaseButton().setCustomId(CANCEL_ID).setLabel('Cancel').setStyle(ButtonStyle.Danger);

export const headCountButtons = [abortButton, endButton];
export const afkCheckButtons = [changeLocationButton, revealLocationButton, abortButton, endButton, finishButton];
