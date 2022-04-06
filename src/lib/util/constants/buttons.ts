import { UnsafeButtonBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord.js';

const PARTICIPATE_ID = 'participate' as const;
const CHANGE_LOCATION_ID = 'change_location' as const;
const REVEAL_LOCATION_ID = 'reveal_location' as const;
const ABORT_ID = 'abort' as const;
const END_ID = 'end' as const;

export const participateButton = new UnsafeButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(PARTICIPATE_ID)
	.setEmoji({
		name: '🤚',
	});

export const changeLocationButton = new UnsafeButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(CHANGE_LOCATION_ID)
	.setEmoji({
		name: '📝',
	});

export const revealLocationButton = new UnsafeButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setCustomId(REVEAL_LOCATION_ID)
	.setEmoji({
		name: '🗺️',
	});

export const abortButton = new UnsafeButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(ABORT_ID).setEmoji({
	name: '🛑',
});

export const endButton = new UnsafeButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(END_ID).setEmoji({
	name: '❌',
});
