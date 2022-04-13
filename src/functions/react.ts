import { setTimeout } from 'node:timers';
import type { Message } from 'discord.js';

export async function react(message: Message, emoji: string | string[]): Promise<void> {
	if (typeof emoji === 'string') {
		await message.react(emoji).catch(() => undefined);
		return;
	}

	for (const emoji_ of emoji) {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		setTimeout(() => {}, 200);
		await message.react(emoji_).catch(() => undefined);
	}
}
