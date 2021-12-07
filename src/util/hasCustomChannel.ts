import type { BaseCommandInteraction } from "discord.js";
import type { Redis } from "ioredis";
import { container } from "tsyringe";
import { kRedis } from "../tokens";

export async function hasCustomChannel(
  interaction: BaseCommandInteraction
): Promise<void> {
  const redis = container.resolve<Redis>(kRedis);
  const active = await redis.get(`channel:${interaction.user.id}`);

  const { deferred } = interaction;

  if (!active) {
    await interaction[deferred ? "editReply" : "reply"]({
      content: "You need to create a custom channel to run this command.",
    });
  }
}
