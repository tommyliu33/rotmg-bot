/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-namespace */

import { Embed, inlineCode, hyperlink } from '@discordjs/builders';
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

const shatters = dungeons['shatters'];
const void_ = dungeons['void'];
const oryx = dungeons['oryx'];
const fungal = dungeons['fungal'];
const nest = dungeons['nest'];
const cult = dungeons['cult'];

// TODO: FULLSKIP VOID

export namespace Embeds {
	const ShattersHeadcount = new Embed()
		.setColor(Colors.TheShatters)
		.setThumbnail(arrayRandom(shatters.images))
		.setDescription(
			stripIndents`
			If you want to participate in this raid, click on the portal icon (${shatters.buttons[0][0].emoji})
			If you have key(s) and are willing to pop for this run, click ${shatters.buttons[0][1].emoji}

			If you can rush monuments, click <:ShattersRusher:895458059894284319>
			If you know how to do the ${hyperlink(
				'Lights Out puzzle',
				'https://osanc.net/solver',
				'Lights out puzzle solver'
			)}, click <:LightsOutPuzzle:908439164087840819>

			Click the corresponding buttons to  indicate class/gear choices
			`
		);

	const VoidHeadcount = new Embed()
		.setColor(Colors.TheVoid)
		.setThumbnail(arrayRandom(void_.images))
		.setTitle(inlineCode(void_.fullName))
		.setDescription(
			stripIndents`
			If you want to participate in this raid, click on the portal icon (${void_.buttons[0][0].emoji})
			If you have a key and are willing to pop for this run, click ${void_.buttons[0]
				.slice(1)
				.map((c) => c.emoji)
				.join('')}

			Click the corresponding buttons to indicate class/gear choices`
		);

	const OryxHeadcount = new Embed()
		.setColor(Colors.OryxSanctuary)
		.setThumbnail(arrayRandom(oryx.images))
		.setTitle(inlineCode(oryx.fullName)).setDescription(stripIndents`
		If you want to participate in this raid, click on the portal icon (${oryx.buttons[0][0].emoji})
		If you have a key and are willing to pop for this run, click ${oryx.buttons[0]
			.slice(1)
			.map((b) => b.emoji)
			.join('')}

		Click the corresponding buttons to indicate class/gear choices`);

	const FungalHeadcount = new Embed()
		.setColor(Colors.FungalCavern)
		.setThumbnail(arrayRandom(fungal.images))
		.setTitle(inlineCode(fungal.fullName)).setDescription(stripIndents`
		Click ${fungal.buttons[0][0].emoji} to indiciate that you want to join
		If you have a key and are willing to pop for this run, click ${fungal.buttons[0][1].emoji}

		Click the corresponding buttons to indicate class/gear choices`);

	const NestHeadcount = new Embed()
		.setTimestamp()
		.setColor(Colors.TheNest)
		.setThumbnail(arrayRandom(nest.images))
		.setTitle(inlineCode(nest.fullName)).setDescription(stripIndents`
		If you want to participate in this raid, click on the portal icon (${nest.buttons[0][0].emoji})
		If you have a key and are willing to pop for this run, click ${nest.buttons[0][1].emoji}

		Please bring the following items if you have them <:Slow:930900333859840002> <:QuiverOfThunder:887925455783600148>

		Click the corresponding buttons to indicate class/gear choices`);

	const CultHeadcount = new Embed()
		.setColor(Colors.CultistHideout)
		.setThumbnail(arrayRandom(cult.images))
		.setTitle(inlineCode(cult.fullName)).setDescription(stripIndents`
	If you want to participate in this raid, click on the portal icon (${cult.buttons[0][0].emoji})
	If you have a key and are willing to pop, click ${cult.buttons[0][1].emoji}

	If you can rush pot rooms, click <:Planewalker:886332230362861608>

	Click the corresponding buttons to indicate class/gear choices`);

	export const Headcount = [
		OryxHeadcount,
		ShattersHeadcount,
		VoidHeadcount,
		FungalHeadcount,
		NestHeadcount,
		CultHeadcount,
	];

	const ShattersAfk = new Embed()
		.setColor(Colors.TheShatters)
		.setThumbnail(arrayRandom(shatters.images))
		.setDescription(
			stripIndents`
	If you want to participate in this raid, first join the voice channel, and then click on the portal icon (${
		shatters.buttons[0][0].emoji
	}).
	
	If you have key(s) and are willing to pop for this run, click ${shatters.buttons[0][1].emoji}

	If you can rush monuments, click <:ShattersRusher:895458059894284319>
	If you know how to do the ${hyperlink(
		'Lights Out puzzle',
		'https://osanc.net/solver',
		'Lights out puzzle solver'
	)}, click <:LightsOutPuzzle:908439164087840819>

	Click the corresponding buttons to indicate class/gear choices`
		);

	const OryxAfk = new Embed();
	const VoidAfk = new Embed();
	const FungalAfk = new Embed();
	const NestAfk = new Embed();
	const CultAfk = new Embed();

	export const AfkCheck = [OryxAfk, ShattersAfk, VoidAfk, FungalAfk, NestAfk, CultAfk];
}
