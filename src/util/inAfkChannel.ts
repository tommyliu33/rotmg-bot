import { getGuildSetting, SettingsKey } from "@functions";
import type { BaseCommandInteraction, Message } from "discord.js";

export async function inAfkChannel(
  interaction: BaseCommandInteraction
): Promise<boolean> {
  const channels = [
    await getGuildSetting(interaction.guildId, SettingsKey.AfkCheck),
    await getGuildSetting(interaction.guildId, SettingsKey.VetAfkCheck),
  ];

  return channels.includes(interaction.channelId);
}
