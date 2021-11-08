import type { CommandInteraction, Snowflake } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { prompt, PromptOptions } from "@functions";

const PROMPTS: PromptOptions[] = [
  {
    question:
      "Send the embed code (go here to build a custom embed <https://leovoel.github.io/embed-visualizer/>)",
    expected: "n/a",
  },
];

@Discord()
@SlashGroup("template", "create and view templates for custom channels")
export abstract class PingCommand {
  @Slash("create", {
    description: "create a template",
  })
  private async create(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the template",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const res = await prompt(interaction, PROMPTS, []);
    console.log("res in command", res);

    await interaction.editReply("done.");
  }

  @Slash("view", {
    description: "view a raiding template",
  })
  private async view(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the template",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.reply("view " + name);
  }
}

interface RaidTemplate {
  title: string;
  reacts: string[];
  author: Snowflake;
  body: string;
}
