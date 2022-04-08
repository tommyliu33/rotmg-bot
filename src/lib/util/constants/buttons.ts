import { ButtonBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord.js';

const PARTICIPATE_ID = 'participate' as const;
const CHANGE_LOCATION_ID = 'change_location' as const;
const REVEAL_LOCATION_ID = 'reveal_location' as const;
const ABORT_ID = 'abort' as const;
const END_ID = 'end' as const;
const DONE_ID = 'done' as const;
const CANCEL_ID = 'cancel' as const;

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

// #endregion

// #region Verification
export const doneButton = new ButtonBuilder().setCustomId(DONE_ID).setLabel('Done').setStyle(ButtonStyle.Primary);
export const cancelButton = new ButtonBuilder().setCustomId(CANCEL_ID).setLabel('Cancel').setStyle(ButtonStyle.Danger);
// #endregion
