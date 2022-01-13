import type { InteractionButtonOptions } from 'discord.js';

// TODO: refactor
enum Reacts {
	WARRIOR = '<:Warrior:930900284413194240>',
	PALADIN = '<:Paladin:930900392110358579>',
	KNIGHT = '<:Knight:930900421084606565>',
	WIZARD = '<:Wizard:886328165126008852>',
	MYSTIC = '<:Mystic:886331698147635240>',
	TRICKSTER = '<:Trickster:886331697858228226>',

	FUNGAL_TOME = '<:TomeOfTheMushroomTribes:886328344126300221>',
	MARBLE_SEAL = '<:MarbleSeal:886328165054697562>',

	SLOW = '<:Slow:930900333859840002>',
	ARMOR_BREAK = '<:ArmorBreak:886328650562162740>',
	DAZE = '<:QuiverOfThunder:887925455783600148>',
}

type Button = InteractionButtonOptions & { confirm?: boolean };

export interface Dungeon {
	name: string;
	full_name: string;

	portal: string;
	keys: DungeonReacts[];

	main_reacts: DungeonReacts[];
	optional_reacts?: DungeonReacts[];

	rusher?: {
		emote: string;
		what: string;
	};

	color: number;
	images: string[];

	buttons?: Button[][];
}

interface DungeonReacts {
	name: string;
	emote: string;
	limit: number;
}

const dungeons: Dungeon[] = [
	{
		name: 'shatters',
		full_name: 'The Shatters',

		portal: '<:ShattersPortal:887532566977069138>',
		keys: [
			{
				name: 'key',
				emote: '<:ShattersKey:887532668181422122>',
				limit: 1,
			},
		],
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'knight',
				emote: Reacts.KNIGHT,
				limit: 0,
			},
		],
		optional_reacts: [
			{
				name: 'fungal_tome',
				emote: Reacts.FUNGAL_TOME,
				limit: 2,
			},
			{
				name: 'slow',
				emote: Reacts.SLOW,
				limit: 1,
			},
		],

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

		rusher: {
			emote: '<:ShattersRusher:895458059894284319>',
			what: 'monuments',
		},

		color: 0x4e4e4e,
		images: [
			'https://i.imgur.com/vatlKfa.png',
			'https://i.imgur.com/bnKFZjt.png',
			'https://i.imgur.com/qL3BVpR.png',
			'https://i.imgur.com/lmde5Ct.png',
		],
	},

	{
		name: 'cult',
		full_name: 'Cultist Hideout',

		portal: '<:CultistHideout:915138896604590120>',
		keys: [
			{
				name: 'key',
				emote: '<:LostHallsKey:886130322964639755>',
				limit: 0,
			},
		],
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'knight',
				emote: Reacts.KNIGHT,
				limit: 0,
			},
		],
		optional_reacts: [],

		rusher: {
			emote: '<:Planewalker:886332230362861608>',
			what: 'pot rooms',
		},

		color: 0xe74c3c,
		images: ['https://i.imgur.com/nPkovWR.png'],
	},

	{
		name: 'nest',
		full_name: 'The Nest',
		keys: [
			{
				name: 'key',
				emote: '<:TheNestKey:915140275230343178>',
				limit: 0,
			},
		],
		portal: '<:TheNestPortal:915140112617185320>',
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'knight',
				emote: Reacts.KNIGHT,
				limit: 0,
			},
		],
		optional_reacts: [
			{
				name: 'slow',
				emote: Reacts.SLOW,
				limit: 1,
			},
			{
				name: 'daze',
				emote: Reacts.DAZE,
				limit: 1,
			},
		],

		color: 0xe27425,
		images: ['https://i.imgur.com/hUWc3IV.png'],
	},

	{
		name: 'fungal',
		full_name: 'Fungal Cavern',
		keys: [
			{
				name: 'key',
				emote: '<:FungalCavernKey:915141233247141899>',
				limit: 0,
			},
		],
		portal: '<:FungalCavernPortal:915141137990320139>',
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'knight',
				emote: Reacts.KNIGHT,
				limit: 0,
			},
			{
				name: 'mystic',
				emote: Reacts.MYSTIC,
				limit: 0,
			},
		],
		optional_reacts: [
			{
				name: 'm_seal',
				emote: Reacts.MARBLE_SEAL,
				limit: 0,
			},
			{
				name: 'daze',
				emote: Reacts.DAZE,
				limit: 1,
			},
			{
				name: 'fungal_tome',
				emote: Reacts.FUNGAL_TOME,
				limit: 0,
			},
			{
				name: 'mystic',
				emote: Reacts.MYSTIC,
				limit: 0,
			},
			{
				name: 'armor_break',
				emote: Reacts.ARMOR_BREAK,
				limit: 1,
			},
			{
				name: 'slow',
				emote: Reacts.SLOW,
				limit: 1,
			},
		],

		color: 0x8ac26e,
		images: ['https://i.imgur.com/K6rOQzR.png'],
	},

	{
		name: 'void',
		full_name: 'The Void',
		keys: [
			{
				name: 'key',
				emote: '<:LostHallsKey:886130322964639755>',
				limit: 0,
			},
		],
		portal: '<:Void:886066308075114527>',
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'knight',
				emote: Reacts.KNIGHT,
				limit: 0,
			},
			{
				name: 'trickster',
				emote: Reacts.TRICKSTER,
				limit: 0,
			},
		],
		optional_reacts: [
			{
				name: 'fungal_tome',
				emote: Reacts.FUNGAL_TOME,
				limit: 0,
			},
			{
				name: 'm_seal',
				emote: Reacts.MARBLE_SEAL,
				limit: 0,
			},
			{
				name: 'armor_break',
				emote: Reacts.ARMOR_BREAK,
				limit: 1,
			},
		],

		color: 0x13044f,
		images: ['https://i.imgur.com/7JGSvMq.png'],
	},

	{
		name: 'o3',
		full_name: 'Oryx Sanctuary',
		keys: [
			{
				name: 'inc',
				emote: '<:WineCellarIncantation:886330945404272671>',
				limit: 2,
			},
			{
				name: 'sword_rune',
				emote: '<:SwordRune:886134621127991337>',
				limit: 2,
			},
			{
				name: 'helmet_rune',
				emote: '<:HelmetRune:886134621685837824>',
				limit: 2,
			},
			{
				name: 'shield_rune',
				emote: '<:ShieldRune:886134621178331167>',
				limit: 2,
			},
		],
		portal: '<:OryxSanctuaryPortal:908398287994896444>',
		main_reacts: [
			{
				name: 'warrior',
				emote: Reacts.WARRIOR,
				limit: 0,
			},
			{
				name: 'paladin',
				emote: Reacts.PALADIN,
				limit: 0,
			},
			{
				name: 'wizard',
				emote: Reacts.WIZARD,
				limit: 0,
			},
			{
				name: 'mystic',
				emote: Reacts.MYSTIC,
				limit: 0,
			},
			{
				name: 'trickster',
				emote: Reacts.TRICKSTER,
				limit: 0,
			},
		],
		optional_reacts: [
			{
				name: 'fungal_tome',
				emote: Reacts.FUNGAL_TOME,
				limit: 0,
			},
			{
				name: 'm_seal',
				emote: Reacts.MARBLE_SEAL,
				limit: 0,
			},
			{
				name: 'slow',
				emote: Reacts.SLOW,
				limit: 1,
			},
			{
				name: 'armor_break',
				emote: Reacts.ARMOR_BREAK,
				limit: 1,
			},
		],

		color: 0xf1c40f,
		images: ['https://i.imgur.com/3Biywi7.png', 'https://i.imgur.com/DSVqdZo.png'],
	},
];

export { dungeons };
