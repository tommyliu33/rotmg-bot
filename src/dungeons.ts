import type { InteractionButtonOptions } from 'discord.js';

export enum Reacts {
	WARRIOR = '<:Warrior:930900284413194240>',
	PALADIN = '<:Paladin:930900392110358579>',
	KNIGHT = '<:Knight:930900421084606565>',
	WIZARD = '<:Wizard:930900309964906616>',
	MYSTIC = '<:Mystic:930900408661053470>',
	TRICKSTER = '<:Trickster:930900321914486796>',

	FUNGAL_TOME = '<:TomeOfTheMushroomTribes:886328344126300221>',
	MARBLE_SEAL = '<:MarbleSeal:886328165054697562>',

	SLOW = '<:Slow:930900333859840002>',
	ARMOR_BREAK = '<:ArmorBreak:886328650562162740>',
	DAZE = '<:QuiverOfThunder:887925455783600148>',
}

export type Button = InteractionButtonOptions & { confirm?: boolean };

type DungeonNames = 'shatters' | 'void' | 'oryx' | 'fungal' | 'nest' | 'cult';
export type DungeonMap = {
	[dungeon in DungeonNames]: { name: string; fullName: string; buttons: Button[][]; images: string[] };
};
export type ValueOf<T> = T[keyof T];

const dungeons: DungeonMap = {
	shatters: {
		name: 'shatters',
		fullName: 'The Shatters',
		buttons: [
			[
				{
					customId: 'portal',
					emoji: '<:ShattersPortal:887532566977069138>',
					style: 'PRIMARY',
				},
				{
					customId: 'key',
					emoji: '<:ShattersKey:887532668181422122>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'rusher',
					style: 'SECONDARY',
					emoji: '<:ShattersRusher:895458059894284319>',
				},
				{
					customId: 'puzzle',
					style: 'SECONDARY',
					emoji: '<:LightsOutPuzzle:908439164087840819>',
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
				{
					customId: 'fungal_tome',
					emoji: Reacts.FUNGAL_TOME,
					style: 'SECONDARY',
				},
				{
					customId: 'slow',
					emoji: Reacts.SLOW,
					style: 'SECONDARY',
				},
			],
		],
		images: [
			'https://i.imgur.com/vatlKfa.png',
			'https://i.imgur.com/bnKFZjt.png',
			'https://i.imgur.com/qL3BVpR.png',
			'https://i.imgur.com/lmde5Ct.png',
		],
	},
	void: {
		name: 'void',
		fullName: 'The Void',
		images: ['https://i.imgur.com/7JGSvMq.png'],
		buttons: [
			[
				{
					customId: 'portal',
					emoji: '<:Void:886066308075114527>',
					style: 'PRIMARY',
				},
				{
					customId: 'key',
					emoji: '<:LostHallsKey:886130322964639755>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'vial',
					emoji: '<:VialOfPureDarkness:886326037212966922>',
					style: 'PRIMARY',
					confirm: true,
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
				{
					customId: 'fungal_tome',
					emoji: Reacts.FUNGAL_TOME,
					style: 'SECONDARY',
				},
				{
					customId: 'marble_seal',
					emoji: Reacts.MARBLE_SEAL,
					style: 'SECONDARY',
				},
			],
		],
	},
	oryx: {
		name: 'oryx',
		fullName: 'Oryx Sanctuary',
		buttons: [
			[
				{
					customId: 'portal',
					emoji: '<:OryxSanctuaryPortal:908398287994896444>',
					style: 'PRIMARY',
				},
				{
					customId: 'inc',
					emoji: '<:WineCellarIncantation:886330945404272671>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'sword_rune',
					emoji: '<:SwordRune:886134621127991337>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'helmet_rune',
					emoji: '<:HelmetRune:886134621685837824>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'shield_rune',
					emoji: '<:ShieldRune:886134621178331167>',
					style: 'PRIMARY',
					confirm: true,
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
				{
					customId: 'wizard',
					style: 'SECONDARY',
					emoji: Reacts.WIZARD,
				},
				{
					customId: 'trickster',
					style: 'SECONDARY',
					emoji: Reacts.TRICKSTER,
				},
			],
		],
		images: ['https://i.imgur.com/3Biywi7.png', 'https://i.imgur.com/DSVqdZo.png'],
	},
	fungal: {
		name: 'fungal',
		fullName: 'Fungal Cavern',
		buttons: [
			[
				{
					customId: 'portal',
					style: 'PRIMARY',
					emoji: '<:FungalCavernPortal:915141137990320139>',
				},
				{
					customId: 'key',
					style: 'PRIMARY',
					emoji: '<:FungalCavernKey:915141233247141899>',
					confirm: true,
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
				{
					customId: 'mystic',
					emoji: Reacts.MYSTIC,
					style: 'SECONDARY',
				},
				{
					customId: 'slow',
					emoji: Reacts.SLOW,
					style: 'SECONDARY',
				},
			],
		],
		images: ['https://i.imgur.com/K6rOQzR.png'],
	},
	nest: {
		name: 'nest',
		fullName: 'The Nest',
		buttons: [
			[
				{
					customId: 'portal',
					style: 'PRIMARY',
					emoji: '<:TheNestPortal:915140112617185320>',
				},
				{
					customId: 'key',
					style: 'PRIMARY',
					emoji: '<:TheNestKey:915140275230343178>',
					confirm: true,
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
				{
					customId: 'slow',
					emoji: Reacts.SLOW,
					style: 'SECONDARY',
				},
				{
					customId: 'daze',
					emoji: Reacts.DAZE,
					style: 'SECONDARY',
				},
			],
		],
		images: ['https://i.imgur.com/hUWc3IV.png'],
	},
	cult: {
		name: 'cult',
		fullName: 'Cultist Hideout',
		buttons: [
			[
				{
					customId: 'portal',
					emoji: '<:Malus:886067005659160576>',
					style: 'PRIMARY',
				},
				{
					customId: 'key',
					emoji: '<:LostHallsKey:886130322964639755>',
					style: 'PRIMARY',
					confirm: true,
				},
				{
					customId: 'rusher',
					emoji: '<:Planewalker:886332230362861608>',
					style: 'SECONDARY',
				},
			],
			[
				{
					customId: 'warrior',
					style: 'SECONDARY',
					emoji: Reacts.WARRIOR,
				},
				{
					customId: 'knight',
					style: 'SECONDARY',
					emoji: Reacts.KNIGHT,
				},
				{
					customId: 'paladin',
					style: 'SECONDARY',
					emoji: Reacts.PALADIN,
				},
			],
		],
		images: ['https://i.imgur.com/nPkovWR.png'],
	},
};

export { dungeons };
