import { chunk } from '@sapphire/utilities';
import {
	ActionRowBuilder,
	AnyComponentBuilder,
	ButtonBuilder,
	ButtonStyle,
	normalizeArray,
	RestOrArray,
} from 'discord.js';

export const PARTICIPATE_ID = 'participate' as const;
export const CHANGE_LOCATION_ID = 'change_location' as const;
export const REVEAL_LOCATION_ID = 'reveal_location' as const;
export const ABORT_ID = 'abort' as const;
export const END_ID = 'end' as const;
export const FINISH_ID = 'finish' as const;
export const DONE_ID = 'done' as const;
export const CANCEL_ID = 'cancel' as const;

// #region Afk / control panel
export const participateButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(PARTICIPATE_ID)
	.setEmoji({
		name: '🤚',
	});

export const changeLocationButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(CHANGE_LOCATION_ID)
	.setEmoji({
		name: '📝',
	});

export const revealLocationButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(REVEAL_LOCATION_ID)
	.setEmoji({
		name: '🗺️',
	});

export const abortButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(ABORT_ID).setEmoji({
	name: '🛑',
});

export const endButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(END_ID).setEmoji({
	name: '❌',
});

export const finishButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(FINISH_ID).setEmoji({
	name: '✅',
});

// #endregion

// #region Verification
export const doneButton = new ButtonBuilder().setCustomId(DONE_ID).setLabel('Done').setStyle(ButtonStyle.Primary);
export const cancelButton = new ButtonBuilder().setCustomId(CANCEL_ID).setLabel('Cancel').setStyle(ButtonStyle.Danger);

export const headCountButtons = [abortButton, endButton];
export const afkCheckButtons = [changeLocationButton, revealLocationButton, abortButton, endButton, finishButton];

// #endregion

// #region Message component

// Copyright © 2020 The Sapphire Community and its contributors
export function generateActionRows<Component extends AnyComponentBuilder>(components: RestOrArray<Component>) {
	components = normalizeArray(components);

	const chunks = chunk(components, 5);
	const rows = chunks.map((chunk) => new ActionRowBuilder<Component>().addComponents(...chunk));

	return rows;
}

// #endregion
