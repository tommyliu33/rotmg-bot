import type { CommandInteraction, Snowflake } from "discord.js";
import { Command, Channel, Raids } from "@struct";

import { inAfkChannel } from "@util";
import { createChannel, getGuildSetting, SettingsKey } from "@functions";

import { container } from "tsyringe";
import { kRaids, kRedis } from "../../tokens";
import type { Redis } from "ioredis";

const redis = container.resolve<Redis>(kRedis);
const emitter = container.resolve<Raids>(kRaids);
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
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    if (["create"].includes(subcommand)) {
      await inAfkChannel(interaction);
    }

    switch (subcommand) {
      case "create":
        await this.create(interaction);
        break;
      case "close":
        await this.close(interaction);
        break;
      case "unlock":
        await this.unlock(interaction);
        break;
      case "lock":
        await this.lock(interaction);
        break;
      case "cap":
        await this.cap(interaction);
        break;
    }
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

    const channelInfo: Omit<Channel, "messageId"> = {
      name: channel?.name as Snowflake,
      channelId: interaction.channelId,
      voiceChannelId: channel?.id as Snowflake,

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
    await interaction.editReply({ content: "Created your channel." });
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
    await interaction.editReply({ content: "Closed your channel." });
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

    await redis.set(
      key,
      JSON.stringify({
        ...channel_,
        state: "OPENED",
      })
    );
    emitter.emit("channelOpen", interaction, {
      ...channel_,
      state: "OPENED",
    });
    await interaction.editReply({ content: "Opened your channel." });
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

    await redis.set(
      key,
      JSON.stringify({
        ...channel_,
        state: "LOCKED",
      })
    );
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
      interaction.options.getInteger("cap", true)
    );
    await interaction.editReply({ content: "Updated channel cap." });
  }
}
