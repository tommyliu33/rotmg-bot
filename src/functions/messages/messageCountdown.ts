import { clearInterval, setInterval } from 'node:timers';

import type { Message } from 'discord.js';
import { EmbedBuilder } from '@discordjs/builders';

const timeString = (ms: number) => {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);
	return `${minutes} min ${seconds} sec`;
};

export function messageCountdown(msg: Message, length: number, interval: number) {
	if (msg.embeds[0] && !msg.embeds[0].data.footer?.text) {
		const embed = new EmbedBuilder(msg.embeds[0].data);
		embed.setFooter({ text: `Time remaining: ${timeString(length)}` });
		void msg.edit({ embeds: [embed.toJSON()] });
	}

	const int = setInterval(() => {
		length -= interval;

		if (length === 0) {
			if (msg.components.length) void msg.edit({ components: [] }).catch(() => undefined);

			const embed = new EmbedBuilder(msg.embeds[0].data).setFooter(null);
			void msg.edit({ embeds: [embed.toJSON()] });
			clearInterval(int);
		}

		const text = `Time remaining: ${timeString(length)}`;
		msg.edit({ embeds: [new EmbedBuilder(msg.embeds[0].data).setFooter({ text }).toJSON()] }).catch(() => undefined);
	}, interval);
}
