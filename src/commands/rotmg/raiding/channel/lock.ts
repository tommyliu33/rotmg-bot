import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import type { Redis } from "ioredis";
import { container } from "tsyringe";
import { kRedis } from "../../../../tokens";

@Discord()
@SlashGroup("channel")
export class LockChannelCommand {
  @Slash("lock", {
    description: "Locks the channel",
  })
  private async lock(interaction: CommandInteraction): Promise<void> {
    const redis = container.resolve<Redis>(kRedis);
    const active = await redis.get(`channel:${interaction.user.id}`);
    if (!active) {
      return interaction.reply({
        content: "Create a channel first.",
        ephemeral: true,
      });
    }

    const raid = JSON.parse(active!);
    const { channelId, msgId, roleId, state } = raid;

    if (state === "LOCKED") {
      return interaction.reply({
        content: "Channel is already locked.",
        ephemeral: true,
      });
    }

    const channel = await interaction.guild?.channels.fetch(channelId);
    await channel?.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    await redis.set(
      `channel:${interaction.user.id}`,
      JSON.stringify({ ...raid, state: "LOCKED" })
    );
    await interaction.reply({
      content: "Locked the channel.",
      ephemeral: true,
    });

    const msg = await interaction.channel?.messages.fetch(msgId);
    if (!msg) return;

    const embed = new MessageEmbed(msg.embeds[0])
      .setFields([])
      .setDescription("Please wait for the channel to open")
      .addField("Status", `Locked ${Formatters.time(new Date(), "R")}`)
      .setColor("YELLOW");

    await msg.edit({
      content: " ",
      embeds: [embed],
    });
    return;
  }
}
