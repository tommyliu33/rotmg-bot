import { Guild, TextChannel, Snowflake } from "discord.js";
export async function getModLogChannel(guild: Guild, channelId: Snowflake) {
  try {
    const modLogChannel = (await guild.channels.fetch(
      channelId
    )) as TextChannel;
    return modLogChannel;
  } catch (e) {
    return null;
  }
}
