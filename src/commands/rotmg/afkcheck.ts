import type { CommandInteraction, EmojiResolvable } from "discord.js";
import { Command, Raid, emitter } from "@struct";

import { inAfkChannel } from "@util";
import { dungeons } from "../../dungeons";

import { kRedis } from "../../tokens";
import { container } from "tsyringe";
import type { Redis } from "ioredis";

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

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    await inAfkChannel(interaction);

    const dungeon =
      dungeons[
        dungeons.findIndex(
          (d) => d.name === interaction.options.getString("dungeon")
        )
      ]!;

    const member = await interaction.guild?.members
      .fetch(interaction.user.id)
      .catch(() => {
        return undefined;
      });

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

    const data: Omit<Raid, "voiceChannelId" | "messageId"> = {
      dungeon,
      reacts: [...reacts.filter((c) => c !== ""), "❌"],

      channelId: interaction.channelId,

      leaderId: interaction.user.id,
      leaderName: member?.displayName as string,
    };

    await container
      .resolve<Redis>(kRedis)
      .set(
        `raid:${interaction.guildId}:${interaction.user.id}`,
        JSON.stringify(data)
      );

    emitter.emit("raidStart", interaction, data);
  }
}
