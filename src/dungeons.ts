interface Dungeon {
  name: string;
  "full-name": string;
  reacts: DungeonReacts[];

  thumbnail: string;
}

interface DungeonReacts {
  emote: string;
  limit: number;
}

const dungeons: Dungeon[] = [
  {
    name: "void",
    "full-name": "The Void",
    reacts: [
      {
        emote: "<:void:886066308075114527>",
        limit: 0, // no limit
      },
    ],

    thumbnail: "https://i.imgur.com/kbzthE4.png",
  },
  {
    name: "cult",
    "full-name": "Cultist Hideout",
    reacts: [
      {
        emote: "<:malus:886067005659160576>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/nPkovWR.png",
  },
  {
    name: "o3",
    "full-name": "Oryx Sanctuary",
    reacts: [
      {
        emote: "<:o3:886067360820236338>",
        limit: 0,
      },
    ],

    thumbnail: "https://i.imgur.com/3Biywi7.png",
  },
];

export { dungeons };
