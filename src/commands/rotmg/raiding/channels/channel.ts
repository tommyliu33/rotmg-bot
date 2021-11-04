import { Database } from "@lib";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { Discord, DIService, Slash, SlashGroup, SlashOption } from "discordx";
import { inject, injectable } from "tsyringe";
import { kDatabase } from "../../../../tokens";

const embed = new MessageEmbed();

@injectable()
@Discord()
@SlashGroup("channel", "base for custom raiding channels")
export class ConfigCommand {
  // weird
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = DIService.container?.resolve(Database)!;
  }

  @Slash("create", {
    description: "create a raiding channel",
    guilds: ["884659225224175626"],
  })
  private async create(
    @SlashOption("name", {
      description: "name of the channel",
      type: "STRING",
    })
    name: string | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    const cfg = await this.db.getGuild(interaction.guildId!);

    await interaction.reply("create");
  }
}
