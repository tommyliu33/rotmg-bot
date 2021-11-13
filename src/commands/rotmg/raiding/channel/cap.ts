import { CommandInteraction, VoiceChannel } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import type { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import { kRedis } from "../../../../tokens";

@injectable()
@Discord()
@SlashGroup("channel")
export class UnlockChannelCommand {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @Slash("cap", {
    description: "Sets a user cap to the channel",
  })
  private async cap(
    @SlashOption("number", {
      type: "NUMBER",
      required: true,
      description: "User cap for the channel",
    })
    number: number,
    interaction: CommandInteraction
  ): Promise<void> {
    const active = await this.redis.get(`channel:${interaction.user.id}`);
    if (!active) {
      return interaction.reply({
        content: "Create a channel first.",
        ephemeral: true,
      });
    }

    const { channelId } = JSON.parse(active);
    const channel = (await interaction.guild?.channels.fetch(
      channelId
    )) as VoiceChannel;

    if (number < 0 || number > 99) {
      return interaction.reply({
        content: "Channel cap should be between 0-99 (inclusive).",
        ephemeral: true,
      });
    }

    await channel?.setUserLimit(number);
    if (number === 0) {
      return interaction.reply({
        content: "Removed the channel cap.",
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: `Changed channel cap to ${number} users.`,
        ephemeral: true,
      });
    }
  }
}
