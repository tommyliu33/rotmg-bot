import type { ColorResolvable } from "discord.js";

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

    portal: "<:shatters:887532566977069138>",
    keys: [
      {
        name: "key",
        emote: "<:shatters_key:887532668181422122>",
        limit: 0,
      },
    ],
    main_reacts: [
      {
        name: "warrior",
        emote: "<:warrior:886328165088231494>",
        limit: 0,
      },
      {
        name: "paladin",
        emote: "<:paladin:886328165172129852>",
        limit: 0,
      },
      {
        name: "knight",
        emote: "<:knight:886328165142790204>",
        limit: 0,
      },
      {
        name: "wizard",
        emote: "<:wizard:886328165126008852>",
        limit: 0,
      },
    ],
    optional_reacts: [
      {
        name: "fungal_tome",
        emote: "<:fungal_tome:886328344126300221>",
        limit: 2,
      },
      {
        name: "slow",
        emote: "<:slow:886331698101510206>",
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
        emote: "<:wine_cellar_inc:886330945404272671>",
        limit: 2,
      },
      {
        name: "sword_rune",
        emote: "<:sword_rune:886134621127991337>",
        limit: 2,
      },
      {
        name: "helmet_rune",
        emote: "<:helmet_rune:886134621685837824>",
        limit: 2,
      },
      {
        name: "shield_rune",
        emote: "<:shield_rune:886134621178331167>",
        limit: 2,
      },
    ],
    portal: "<:o3:886067360820236338>",
    main_reacts: [
      {
        name: "warrior",
        emote: "<:warrior:886328165088231494>",
        limit: 0,
      },
      {
        name: "paladin",
        emote: "<:paladin:886328165172129852>",
        limit: 0,
      },
      {
        name: "knight",
        emote: "<:knight:886328165142790204>",
        limit: 0,
      },
      {
        name: "wizard",
        emote: "<:wizard:886328165126008852>",
        limit: 0,
      },
      {
        name: "mystic",
        emote: "<:mystic:886331698147635240>",
        limit: 0,
      },
      {
        name: "trickster",
        emote: "<:trickster:886331697858228226>",
        limit: 0,
      },
    ],
    optional_reacts: [
      {
        name: "fungal_tome",
        emote: "<:fungal_tome:886328344126300221>",
        limit: 0,
      },
      {
        name: "m_seal",
        emote: "<:m_seal:886328165054697562>",
        limit: 0,
      },
      {
        name: "slow",
        emote: "<:slow:886331698101510206>",
        limit: 1,
      },
      {
        name: "armor_break",
        emote: "<:armor_break:886328650562162740>",
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
