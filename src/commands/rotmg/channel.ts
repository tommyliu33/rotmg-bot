import type { CommandInteraction } from "discord.js";
import { Command, Channel, emitter } from "@struct";

import { inAfkChannel } from "@util";
import { createChannel, getGuildSetting, SettingsKey } from "@functions";

import { container } from "tsyringe";
import { kRedis } from "../../tokens";
import type { Redis } from "ioredis";

const redis = container.resolve<Redis>(kRedis);
const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) : str;

export default class implements Command {
  public name = "channel";
  public description = "base for managing custom raid channels.";
  public options = [
    {
      name: "create",
      description: "create a custom channel.",
      type: 1,
      options: [
        {
          name: "name",
          description: "name of the channel to create.",
          type: 3,
          required: true,
        },
      ],
    },
    {
      name: "close",
      description: "deletes your custom channel.",
      type: 1,
    },
    {
      name: "lock",
      description: "prevent raiders from joining your custom channel.",
      type: 1,
    },
    {
      name: "unlock",
      description: "allow raiders to join your custom channel.",
      type: 1,
    },
    {
      name: "cap",
      description: "change user cap for your custom channel.",
      type: 1,
      options: [
        {
          name: "cap",
          description: "the new channel cap (0-99)",
          required: true,
          type: 4,
          // TODO: discord.js v13.4
          // min_value: 0,
          // max_value: 99,
        },
      ],
    },
  ];

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (["create"].includes(subcommand)) {
      await inAfkChannel(interaction);
    }

    // @ts-ignore
    await this[subcommand].call(interaction);
  }

  private async create(interaction: CommandInteraction): Promise<void> {
    if (await redis.exists(`channel:${interaction.user.id}`)) {
      await interaction.editReply({
        content: "Close your current channel before starting another.",
      });
      return;
    }

    const vetChannelId = await getGuildSetting(
      interaction.guildId,
      SettingsKey.VetAfkCheck
    );

    const veteran = interaction.channelId === vetChannelId;
    const roleId = await getGuildSetting(
      interaction.guildId,
      veteran ? SettingsKey.VetUserRole : SettingsKey.MainUserRole
    );

    const channelName = truncate(
      interaction.options.getString("name", true),
      100
    );
    const channel = await createChannel(
      interaction.guild!,
      channelName,
      veteran
    );

    await channel?.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    const member = await channel?.guild.members
      .fetch(interaction.user.id)
      .catch(() => {
        return undefined;
      });

    const channelInfo = {
      name: channel?.name,
      channelId: interaction.channelId,
      voiceChannelId: channel?.id,

      leaderId: interaction.user.id,
      leaderName: member?.displayName,

      roleId: roleId,

      state: "LOCKED",
    };

    await redis.set(
      `channel:${interaction.user.id}`,
      JSON.stringify(channelInfo)
    );
    emitter.emit("channelStart", interaction, channelInfo);
  }

  private async close(interaction: CommandInteraction): Promise<void> {
    const key = `channel:${interaction.user.id}`;
    const has = await redis.exists(key);
    if (!has) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = await redis.get(key);
    const channel_: Channel = JSON.parse(channel!);

    emitter.emit("channelClose", interaction, {
      ...channel_,
      state: "CLOSED",
    });
  }

  private async unlock(interaction: CommandInteraction): Promise<void> {
    const key = `channel:${interaction.user.id}`;
    const has = await redis.exists(key);

    if (!has) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = await redis.get(key);
    const channel_: Channel = JSON.parse(channel!);

    if (channel_.state === "OPENED") {
      await interaction.editReply({
        content: "Channel is already opened.",
      });
      return;
    }

    emitter.emit("channelOpen", interaction, {
      ...channel_,
      state: "OPENED",
    });
  }

  private async lock(interaction: CommandInteraction): Promise<void> {
    const key = `channel:${interaction.user.id}`;
    const has = await redis.exists(key);

    if (!has) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = await redis.get(key);
    const channel_: Channel = JSON.parse(channel!);

    if (channel_.state === "LOCKED") {
      await interaction.editReply({
        content: "Channel is already locked.",
      });
      return;
    }

    emitter.emit("channelLocked", interaction, {
      ...channel_,
      state: "LOCKED",
    });
  }

  private async cap(interaction: CommandInteraction) {
    const key = `channel:${interaction.user.id}`;
    const has = await redis.exists(key);

    if (!has) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = await redis.get(key);
    const channel_: Channel = JSON.parse(channel!);

    emitter.emit(
      "channelCapUpdate",
      interaction,
      {
        ...channel_,
        state: "LOCKED",
      },
      interaction.options.getInteger("cap")
    );
  }
}
