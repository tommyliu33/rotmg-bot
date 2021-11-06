import type { CommandInteraction, Snowflake } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup("template", "create and view templates for custom channels")
export abstract class PingCommand {
  @Slash("create", {
    description: "create a template",
  })
  private async create(interaction: CommandInteraction): Promise<void> {
    await interaction.reply("create");
  }

  @Slash("view", {
    description: "view a raiding template",
  })
  private async view(
    @SlashOption("name", { type: "STRING" })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.reply("view");
  }
}

interface RaidTemplate {
  title: string;
  reacts: string[];
  author: Snowflake;
}
