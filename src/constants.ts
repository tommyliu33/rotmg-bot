/* eslint-disable @typescript-eslint/no-namespace */

// constant buttons for headcounts etc embeds

import { Embed, inlineCode } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import { MessageActionRow, MessageButton } from 'discord.js';

import { nanoid } from 'nanoid';

import { dungeons } from './dungeons';
import { arrayRandom } from './util';

export const zws = String.fromCharCode(8203);

export const headCountButtonEmojis: Readonly<string[]> = ['✅', '🛑'];
export const controlPanelButtonEmojis: Readonly<string[]> = ['📝', '🗺️', '🛑', '❌'];

export namespace Buttons {
	export const headCountButtons = new MessageActionRow().addComponents(
		headCountButtonEmojis.reduce<MessageButton[]>((row, emoji) => {
			row.push(new MessageButton().setEmoji(emoji).setCustomId(nanoid()).setStyle('PRIMARY'));
			return row;
		}, [])
	);

	export const controlPanelButtons = new MessageActionRow().addComponents(
		controlPanelButtonEmojis.reduce<MessageButton[]>((row, emoji) => {
			row.push(new MessageButton().setEmoji(emoji).setCustomId(nanoid()).setStyle('PRIMARY'));
			return row;
		}, [])
	);
}

enum Colors {
	OryxSanctuary = 0xf1c40f,
	TheShatters = 0x4e4e4e,
	TheVoid = 0x13044f,
	CultistHideout = 0xe74c3c,
	TheNest = 0xe27425,
	FungalCavern = 0x8ac26e,
}

const shatters = dungeons[0];

export namespace Embeds {
	export namespace Headcount {
		const base = new Embed().setTimestamp();

		export const Shatters = base
			.setThumbnail(arrayRandom(shatters.images))
			.setColor(Colors.TheShatters)
			.setTitle(inlineCode('The Shatters'))
			.setDescription(
				stripIndents`
			Click ${shatters.buttons[0][0].emoji} to indiciate that you want to join
			If you have a key and are willing to pop, click on ${shatters.buttons[0][1].emoji}

			Otherwise, click on the corresponding buttons to 
			indicate class/gear choices`
			);

		export const Void = new Embed();
	}

	export namespace AfkCheck {
		export const Shatters = new Embed()
			.setTimestamp()
			.setColor(Colors.TheShatters)
			.setThumbnail(arrayRandom(shatters.images))
			.setTitle(inlineCode('The Shatters'))
			.setDescription(
				stripIndents`
			To participate, join the voice channel and click on ${shatters.buttons[0][0].emoji} 
			If you have a key and are willing to pop, click on ${shatters.buttons[0][1].emoji}

			Otherwise, click on the corresponding buttons to 
			indicate class/gear choices`
			);

		export const Void = new Embed();
	}
}
