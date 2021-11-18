import { setGuildSetting, SettingsKey } from "@functions";
import { CommandInteraction, Constants, TextChannel } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup("config")
export abstract class Command {
  @Slash("vet-afk-check")
  private async execute(
    @SlashOption("channel", {
      required: true,
      type: "CHANNEL",
      channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
    })
    channel: TextChannel,
    interaction: CommandInteraction
  ): Promise<void> {
    await setGuildSetting(
      interaction.guildId,
      SettingsKey.VetAfkCheck,
      channel.id
    );

    await interaction.reply({
      content: `Updated the veteran afk check channel to ${channel.toString()}!`,
      ephemeral: true,
    });
  }
}
