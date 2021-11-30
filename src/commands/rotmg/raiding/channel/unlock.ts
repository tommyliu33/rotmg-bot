import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import type { Redis } from "ioredis";
import { container } from "tsyringe";
import { kRedis } from "../../../../tokens";

@Discord()
@SlashGroup("channel")
export class UnlockChannelCommand {
  @Slash("unlock", {
    description: "Unlocks the channel",
  })
  private async open(interaction: CommandInteraction): Promise<void> {
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

    if (state === "OPENED") {
      await interaction.reply({
        content: "Channel is already opened",
        ephemeral: true,
      });
      return;
    }

    const channel = await interaction.guild?.channels.fetch(channelId);

    await channel?.permissionOverwrites.edit(roleId, {
      CONNECT: true,
    });

    await redis.set(
      `channel:${interaction.user.id}`,
      JSON.stringify({ ...raid, state: "OPENED" })
    );

    await interaction.reply({
      content: "Channel opened",
      ephemeral: true,
    });

    const msg = await interaction.channel?.messages.fetch(msgId);
    if (!msg) return;

    const embed = new MessageEmbed(msg.embeds[0])
      .setFields([])
      .setDescription(
        `Click ${Formatters.bold(
          Formatters.underscore("here")
        )} ${channel?.toString()} to join`
      )
      .addField("Status", `Opened ${Formatters.time(new Date(), "R")}`)
      .setColor("GREEN");

    const m = await msg.channel.send({
      content: `@here Channel ${Formatters.inlineCode(
        channel?.name!
      )} has opened (re-ping)`,
      allowedMentions: {
        parse: ["everyone"],
      },
    });
    await m.delete();
    await msg?.edit({
      content: " ",
      embeds: [embed],
    });
  }
}
