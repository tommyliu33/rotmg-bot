import type { TextChannel } from "discord.js";
import { container } from "tsyringe";
import { getGuildSetting, SettingsKey } from "@functions";
import { kClient } from "../tokens";
import type { Bot } from "@lib";

export async function getLogChannel(guildId: string) {
  const client = container.resolve<Bot>(kClient);

  const guild = await client.guilds.fetch(guildId);
  const channelId = await getGuildSetting(guildId, SettingsKey.LogChannel);

  try {
    return (await guild.channels.fetch(channelId)) as TextChannel;
  } catch {
    return null;
  }
}
