import type { Snowflake } from "discord-api-types";
import type { Redis } from "ioredis";
import { container } from "tsyringe";
import { kRedis } from "../../tokens";

interface ChannelInfo {
  channelName: string;
  channelId: Snowflake;

  leaderId: Snowflake;

  messageId: Snowflake;

  roleId: Snowflake;

  state: "LOCKED" | "OPENED" | "CLOSED";
}

export async function getCustomChannel(
  userId: Snowflake
): Promise<ChannelInfo | null> {
  const channel = await container
    .resolve<Redis>(kRedis)
    .get(`channel:${userId}`);

  if (channel) {
    return JSON.parse(channel) as ChannelInfo;
  }

  return null;
}
