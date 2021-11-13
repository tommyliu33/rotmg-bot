import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import type { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import { kRedis } from "../../../../tokens";

@injectable()
@Discord()
@SlashGroup("channel")
export class CloseChannelCommand {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @Slash("close", {
    description: "Closes the channel",
  })
  private async delete(interaction: CommandInteraction): Promise<void> {
    const active = await this.redis.get(`channel:${interaction.user.id}`);

    if (!active) {
      return interaction.reply({
        content: "Create a channel first.",
        ephemeral: true,
      });
    }

    const { channelId, msgId } = JSON.parse(active);
    await this.redis.del(`channel:${interaction.user.id}`);

    const channel = await interaction.guild?.channels.fetch(channelId);
    const msg = await interaction.channel?.messages.fetch(msgId);

    if (channel) {
      await channel?.delete();
    }

    if (msg) {
      await msg.edit({
        content: " ",
        embeds: [
          new MessageEmbed(msg.embeds[0])
            .setFields([])
            .setColor("RED")
            .setDescription(
              `Channel closed ${Formatters.time(new Date(), "R")}`
            ),
        ],
      });
    }

    await interaction.reply({
      content: "Done.",
      ephemeral: true,
    });
  }
}
