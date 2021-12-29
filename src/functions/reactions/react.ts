import type { EmojiResolvable, Message } from 'discord.js';

const deletedMessages = new Set<string>();

export function react(msg: Message, reacts: EmojiResolvable[], delay = 550): void {
	if (msg.client.listenerCount('messageDelete') === 0) {
		msg.client.once('messageDelete', (msg) => void deletedMessages.add(msg.id));
	}

	let i = 0;
	const interval = setInterval(() => {
		// TODO: check if the afk check ended before
		if (msg.reactions.cache.has('❌')) {
			clearInterval(interval);
			return;
		}

		if (i < reacts.length) {
			if (deletedMessages.has(msg.id)) {
				clearInterval(interval);
				return;
			}

			void msg.react(reacts[i]).catch(() => {
				return undefined;
			});
		} else {
			clearInterval(interval);
		}
		i++;
	}, delay);
}
