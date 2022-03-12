import { setInterval } from 'node:timers';

import type { Message } from 'discord.js';

const timeString = (ms: number) => {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);
	return `${minutes} min ${seconds} sec`;
};

export function messageCountdown(msg: Message, length: number, interval: number) {
	if (msg.embeds[0] && !msg.embeds[0].footer?.text) {
		void msg.edit({ embeds: [msg.embeds[0].setFooter({ text: `Time remaining: ${timeString(length)}` })] });
	}

	const int = setInterval(() => {
		length -= interval;

		if (length === 0) {
			if (msg.components.length) {
				const actionRow = msg.components.reduce((row) => {
					row.components.forEach((component) => component.setDisabled(true));
					return row;
				});
				void msg.edit({ components: [actionRow] }).catch(() => undefined);
			}

			void msg.edit({ embeds: [msg.embeds[0].setFooter(null)] });
			clearInterval(int);
		}

		const text = `Time remaining: ${timeString(length)}`;
		msg.edit({ embeds: [msg.embeds[0].setFooter({ text })] }).catch(() => undefined);
	}, interval);
}
