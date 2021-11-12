import type { ColorResolvable } from "discord.js";

enum Reacts {
  WARRIOR = "<:Warrior:886328165088231494>",
  PALADIN = "<:Paladin:886328165172129852>",
  KNIGHT = "<:Knight:886328165142790204>",
  WIZARD = "<:Wizard:886328165126008852>",
  MYSTIC = "<:Mystic:886331698147635240>",
  TRICKSTER = "<:Trickster:886331697858228226>",

  FUNGAL_TOME = "<:TomeOfTheMushroomTribes:886328344126300221>",
  MARBLE_SEAL = "<:MarbleSeal:886328165054697562>",

  SLOW = "<:Slow:886331698101510206>",
  ARMOR_BREAK = "<:ArmorBreak:886328650562162740>",
}

export interface Dungeon {
  name: string;
  full_name: string;

  portal: string;
  keys: DungeonReacts[];

  main_reacts: DungeonReacts[];
  optional_reacts?: DungeonReacts[];

  rusher?: {
    emote: string;
  };

  color: ColorResolvable;
  images: string[];
}

interface DungeonReacts {
  name: string;
  emote: string;
  limit: number;
}

const dungeons: Dungeon[] = [
  {
    name: "shatters",
    full_name: "The Shatters",

    portal: "<:ShattersPortal:887532566977069138>",
    keys: [
      {
        name: "key",
        emote: "<:ShattersKey:887532668181422122>",
        limit: 0,
      },
    ],
    main_reacts: [
      {
        name: "warrior",
        emote: Reacts.WARRIOR,
        limit: 0,
      },
      {
        name: "paladin",
        emote: Reacts.PALADIN,
        limit: 0,
      },
      {
        name: "knight",
        emote: Reacts.KNIGHT,
        limit: 0,
      },
    ],
    optional_reacts: [
      {
        name: "fungal_tome",
        emote: Reacts.FUNGAL_TOME,
        limit: 2,
      },
      {
        name: "slow",
        emote: Reacts.SLOW,
        limit: 1,
      },
    ],

    rusher: {
      emote: "<:ShattersRusher:895458059894284319>",
    },

    color: 0x4e4e4e,
    images: [
      "https://i.imgur.com/vatlKfa.png",
      "https://i.imgur.com/bnKFZjt.png",
      "https://i.imgur.com/qL3BVpR.png",
      "https://i.imgur.com/lmde5Ct.png",
    ],
  },

  {
    name: "o3",
    full_name: "Oryx Sanctuary",
    keys: [
      {
        name: "inc",
        emote: "<:WineCellarIncantation:886330945404272671>",
        limit: 2,
      },
      {
        name: "sword_rune",
        emote: "<:SwordRune:886134621127991337>",
        limit: 2,
      },
      {
        name: "helmet_rune",
        emote: "<:HelmetRune:886134621685837824>",
        limit: 2,
      },
      {
        name: "shield_rune",
        emote: "<:ShieldRune:886134621178331167>",
        limit: 2,
      },
    ],
    portal: "<:OryxSanctuaryPortal:908398287994896444>",
    main_reacts: [
      {
        name: "warrior",
        emote: Reacts.WARRIOR,
        limit: 0,
      },
      {
        name: "paladin",
        emote: Reacts.PALADIN,
        limit: 0,
      },
      {
        name: "wizard",
        emote: Reacts.WIZARD,
        limit: 0,
      },
      {
        name: "mystic",
        emote: Reacts.MYSTIC,
        limit: 0,
      },
      {
        name: "trickster",
        emote: Reacts.TRICKSTER,
        limit: 0,
      },
    ],
    optional_reacts: [
      {
        name: "fungal_tome",
        emote: Reacts.FUNGAL_TOME,
        limit: 0,
      },
      {
        name: "m_seal",
        emote: Reacts.MARBLE_SEAL,
        limit: 0,
      },
      {
        name: "slow",
        emote: Reacts.SLOW,
        limit: 1,
      },
      {
        name: "armor_break",
        emote: Reacts.ARMOR_BREAK,
        limit: 1,
      },
    ],

    color: 0xf1c40f,
    images: [
      "https://i.imgur.com/3Biywi7.png",
      "https://i.imgur.com/DSVqdZo.png",
    ],
  },
];

export { dungeons };
