import type { ColorResolvable } from "discord.js";

interface Dungeon {
  name: string;
  "full-name": string;

  portal: string;
  keys: DungeonReacts[];

  // everything else
  reacts: DungeonReacts[];

  color?: ColorResolvable;
  thumbnail: string;
}

interface DungeonReacts {
  name: string;
  emote: string;
  limit: number;
}

const dungeons: Dungeon[] = [
  //#region shatters
  {
    name: "shatters",
    "full-name": "The Shatters",

    portal: "<:shatters:887532566977069138>",
    keys: [
      {
        name: "key",
        emote: "<:shatters_key:887532668181422122>",
        limit: 0,
      },
    ],
    reacts: [
      {
        name: "fungal_tome",
        emote: "<:fungal_tome:886328344126300221>",
        limit: 2,
      },
      {
        name: "m_seal",
        emote: "<:m_seal:886328165054697562>",
        limit: 2,
      },
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
        name: "trickster",
        emote: "<:trickster:886331697858228226>",
        limit: 0,
      },
    ],
    color: "#4e4e4e",
    thumbnail: "https://i.imgur.com/qL3BVpR.png",
  },
  //endregion
  //#region lost halls
  {
    name: "void",
    "full-name": "The Void",
    keys: [
      {
        name: "key",
        emote: "<:lost_halls_key:886130322964639755>",
        limit: 0,
      },
      {
        name: "vial",
        emote: "<:vial:886326037212966922>",
        limit: 0,
      },
    ],
    portal: "<:void:886066308075114527>",
    reacts: [
      {
        name: "join",
        emote: "<:void:886066308075114527>",
        limit: 0, // no limit
      },
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
        name: "trickster",
        emote: "<:trickster:886331697858228226>",
        limit: 0,
      },
      {
        name: "armor_break",
        emote: "<:armor_break:886328650562162740>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/kbzthE4.png",
    color: "#13044f",
  },
  {
    name: "cult",
    "full-name": "Cultist Hideout",
    keys: [
      {
        name: "key",
        emote: "<:lost_halls_key:886130322964639755>",
        limit: 0,
      },
    ],
    portal: "<:malus:886067005659160576>",
    reacts: [
      {
        name: "rusher",
        emote: "<:rusher:886332230362861608>",
        limit: 0,
      },
      {
        name: "armor_break",
        emote: "<:armor_break:886328650562162740>",
        limit: 0,
      },
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
        name: "trickster",
        emote: "<:trickster:886331697858228226>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/nPkovWR.png",
    color: "#e74c3c",
  },
  //#endregion
  //#region osanc
  {
    name: "o3",
    "full-name": "Oryx Sanctuary",
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
    reacts: [
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

    thumbnail: "https://i.imgur.com/3Biywi7.png",
    color: "#f1c40f",
  },
  //#endregion
];

export { dungeons };
