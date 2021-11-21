import { setGuildSetting, SettingsKey } from "@functions";
import { CategoryChannel, CommandInteraction, Constants } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup("config")
export abstract class VetSectionCommand {
  @Slash("vet-section")
  private async execute(
    @SlashOption("channel", {
      required: true,
      type: "CHANNEL",
      channelTypes: [Constants.ChannelTypes.GUILD_CATEGORY],
    })
    channel: CategoryChannel,
    interaction: CommandInteraction
  ): Promise<void> {
    await setGuildSetting(
      interaction.guildId,
      SettingsKey.MainCategory,
      channel.id
    );

    await interaction.reply({
      content: `Updated the veteran section to ${channel.name}!`,
      ephemeral: true,
    });
  }
}
