import { getGuildSetting, SettingsKey } from "@functions";
import type { BaseCommandInteraction, Message } from "discord.js";

export async function inAfkChannel(
  interaction: BaseCommandInteraction
): Promise<void> {
  const channels = [
    await getGuildSetting(interaction.guildId, SettingsKey.AfkCheck),
    await getGuildSetting(interaction.guildId, SettingsKey.VetAfkCheck),
  ];

  if (!channels.includes(interaction.channelId)) {
    const message = (await interaction[
      interaction.deferred ? "editReply" : "reply"
    ]({
      content: "This command can only be used in an afk check channel.",
      fetchReply: true,
    })) as Message;

    if (!message.flags.has("EPHEMERAL")) {
      setTimeout(() => {
        void message.delete();
      }, 5000);
    }
  }
}
