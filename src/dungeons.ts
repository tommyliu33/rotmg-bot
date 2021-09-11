import type { ColorResolvable } from "discord.js";

interface Dungeon {
  name: string;
  "full-name": string;
  reacts: DungeonReacts[];

  color?: ColorResolvable;
  thumbnail: string;
}

interface DungeonReacts {
  name: string;
  emote: string;
  limit: number;
}

/* mainly exaltation dungeons, others can be "misc" with a provided title */
const dungeons: Dungeon[] = [
  {
    name: "void",
    // TODO: add fsv
    "full-name": "The Void",
    reacts: [
      {
        name: "join",
        emote: "<:void:886066308075114527>",
        limit: 0, // no limit
      },
      {
        name: "key",
        emote:
          "<:lost_halls_key:886130322964639755>|<:vial:886326037212966922>",
        limit: 0,
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
    color: "#1a026c",
  },
  {
    name: "cult",
    "full-name": "Cultist Hideout",
    reacts: [
      {
        name: "join",
        emote: "<:malus:886067005659160576>",
        limit: 0,
      },
      {
        name: "key",
        emote: "<:lost_halls_key:886130322964639755>",
        limit: 0,
      },
      {
        name: "rusher",
        emote: "<:rusher:886332230362861608>",
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
        name: "armor_break",
        emote: "<:armor_break:886328650562162740>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/nPkovWR.png",
    color: "DARK_RED",
  },
  {
    name: "o3",
    "full-name": "Oryx Sanctuary",
    reacts: [
      {
        name: "join",
        emote: "<:o3:886067360820236338>",
        limit: 0,
      },
      {
        name: "runes",
        // we can just split by |
        emote:
          "<:wine_cellar_inc:886330945404272671>|<:sword_rune:886134621127991337>|<:shield_rune:886134621178331167>|<:helmet_rune:886134621685837824>",
        // each emote has 2 limit
        limit: 2,
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
      {
        name: "slow",
        emote: "<:slow:886331698101510206>",
        limit: 1, // or 2
      },
      {
        name: "armor_break",
        emote: "<:armor_break:886328650562162740>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/3Biywi7.png",
    color: "YELLOW",
  },
];

export { dungeons };
