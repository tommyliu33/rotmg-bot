import { SlashCommandBuilder } from "@discordjs/builders";
import { dungeons } from "../../../dungeons";

export const AfkCheckCommand = new SlashCommandBuilder()
  .setName("afkcheck")
  .setDescription("Starts an afk check for a dungeon")
  .addStringOption((option) =>
    option
      .setName("dungeon")
      .setDescription("Dungeon for the raid")
      .addChoices(dungeons.map((d) => [d.full_name, d.name]))
      .setRequired(true)
  )
 .toJSON();
