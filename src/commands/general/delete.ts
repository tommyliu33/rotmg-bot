import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("delete", { description: "deletes all useless channels." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    const channels = await (
      await interaction.guild?.channels.fetch()
    )?.filter((c) => c.type === "GUILD_VOICE" && c.name !== "drag");
    channels?.forEach((c) => c.delete());

    return await interaction.reply("done.");
  }
}
