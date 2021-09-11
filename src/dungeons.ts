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
          "<:sword_rune:886134621127991337>|<:shield_rune:886134621178331167>|<:helmet_rune:886134621685837824>",
        limit: 2,
      },
    ],

    thumbnail: "https://i.imgur.com/3Biywi7.png",
    color: "YELLOW",
  },
];

export { dungeons };
