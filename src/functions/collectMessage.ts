import { mergeDefault } from '@sapphire/utilities';
import type { Message, MessageCollectorOptions, TextBasedChannel } from 'discord.js';

import { MessageCollector } from 'discord.js';

export function collectMessage(options: MessageCollectorOptions & { channel: TextBasedChannel }): Promise<Message> {
	return new Promise((resolve, reject) => {
		const _options = mergeDefault({ max: 1, time: 60_000 }, options);
		const collector = new MessageCollector(options.channel, _options);
		collector.once('end', (messages, reason) => {
			const message = messages.first();
			if (message) resolve(message);
			else reject(reason);
		});
	});
}
