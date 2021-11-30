import { createChannel, getGuildSetting, SettingsKey } from "@functions";
import { AfkCheckChannel } from "@guards";
import { CommandInteraction, Formatters, MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import { kRedis } from "../../../../tokens";

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) : str;

@Discord()
@SlashGroup("channel")
export abstract class CreateChannelCommand {
  @Guard(AfkCheckChannel())
  @Slash("create", {
    description: "Create a channel with a custom name and template",
  })
  private async create(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the channel",
    })
    name: string,
    interaction: CommandInteraction
  ) {
    const redis = container.resolve<Redis>(kRedis);
    const active = await redis.get(`channel:${interaction.user.id}`);
    if (active) {
      return interaction.reply({
        content: "Close your current channel before starting another.",
        ephemeral: true,
      });
    }

    const vetChannelId = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck
    );

    const veteran = interaction.channelId === vetChannelId;
    const roleId = await getGuildSetting(
      interaction.guildId,
      veteran ? SettingsKey.VetUserRole : SettingsKey.MainUserRole
    );

    const channelName = truncate(name, 100);
    const channel = await createChannel(
      interaction.guild!,
      channelName,
      veteran
    );

    await channel?.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    const member = await channel?.guild.members.fetch(interaction.user.id)!;
    const embed = new MessageEmbed()
      .setColor(member?.displayColor)
      .setTitle(
        `${Formatters.inlineCode(
          channelName
        )} started by ${member?.displayName!}`
      )
      .setDescription(
        `Click ${Formatters.bold(
          Formatters.underscore("here")
        )} ${channel?.toString()} to join when the channel opens`
      );

    const m = await interaction.reply({
      content: "@here",
      embeds: [embed],
      allowedMentions: {
        parse: ["everyone"],
      },
      fetchReply: true,
    });

    const raid = {
      leaderId: interaction.user.id,
      channelId: channel?.id,
      msgId: m?.id!,
      roleId,
      state: "LOCKED",
      name: channelName,
    };

    await redis.set(`channel:${interaction.user.id}`, JSON.stringify(raid));
  }
}
