import type { CommandInteraction, Snowflake } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup("template", "create and view templates for custom channels")
export abstract class PingCommand {
  @Slash("create", {
    description: "create a template",
  })
  private async create(
    @SlashOption("name", { type: "STRING", required: true })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    // prompt for additional options ?
		// TODO: add templates to db class and interface
    await interaction.reply("create " + name);
  }

  @Slash("view", {
    description: "view a raiding template",
  })
  private async view(
    @SlashOption("name", { type: "STRING", required: true })
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
