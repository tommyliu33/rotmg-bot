import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import type { Redis } from "ioredis";
import { kRedis } from "../../tokens";
import { container, inject } from "tsyringe";

@Discord()
export class Command {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }
  @Slash("delete", { description: "deletes all useless channels." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    const channels = await (
      await interaction.guild?.channels.fetch()
    )?.filter((c) => c.type === "GUILD_VOICE" && c.name !== "drag");
    channels?.forEach((c) => c.delete());

    await this.redis.flushall();
    return await interaction.reply("done.");
  }
}
