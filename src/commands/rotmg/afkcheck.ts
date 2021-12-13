import type { CommandInteraction, EmojiResolvable } from "discord.js";
import { Command, Raids } from "@struct";

import { inAfkChannel } from "@util";
import { dungeons } from "../../dungeons";

import { kRaids } from "../../tokens";
import { inject, injectable } from "tsyringe";

@injectable()
export default class implements Command {
  public name = "afkcheck";
  public description = "starts an afk check.";
  public options = [
    {
      name: "dungeon",
      description: "the dungeon to run",
      type: 3,
      choices: [
        { name: "Oryx Sanctuary", value: "o3" },
        { name: "The Void", value: "void" },
        { name: "The Shatters", value: "shatters" },
        { name: "Cultist Hideout", value: "cult" },
        { name: "The Nest", value: "nest" },
        { name: "Fungal Cavern", value: "fungal" },
      ],
      required: true,
    },
  ];

  public constructor(@inject(kRaids) public readonly raids: Raids) {}

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const inAfkChannel_ = await inAfkChannel(interaction);
    if (!inAfkChannel_) return;

    const dungeon =
      dungeons[
        dungeons.findIndex(
          (d) => d.name === interaction.options.getString("dungeon")
        )
      ];

    const { portal, keys, main_reacts, optional_reacts, rusher } = dungeon;
    const reacts: EmojiResolvable[] = [
      portal,
      ...keys.map((c) => c.emote),
      rusher?.emote ?? "",
      dungeon.name === "shatters"
        ? "<:LightsOutPuzzle:908439164087840819>"
        : "",
      ...main_reacts.map((c) => c.emote),
    ];

    if (optional_reacts) {
      reacts.push(...optional_reacts.map((c) => c.emote));
    }

    if (dungeon.name !== "shatters" && rusher) {
      reacts.push(rusher.emote);
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);

    const data = {
      dungeon,
      reacts: [...reacts.filter((c) => c !== ""), "❌"],
      reacts_: [],

      location: "TBD",

      guildId: interaction.guildId,
      channelId: interaction.channelId,

      leaderId: interaction.user.id,
      leaderName: member?.displayName,
      leaderTag: interaction.user.tag,
    };

    this.raids.emit("raidStart", data);
    // TODO: defer the interaction -> send cp message embed -> edit interaction to show message link
    await interaction.deleteReply();
  }
}
