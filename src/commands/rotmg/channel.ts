import type { CommandInteraction } from "discord.js";
import { Command, Channel, RaidManager } from "@struct";

import { inAfkChannel } from "@util";
import { createChannel, getGuildSetting, SettingsKey } from "@functions";

import { inject, injectable } from "tsyringe";
import { kRaids, kRedis } from "../../tokens";
import type { Redis } from "ioredis";

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) : str;

@injectable()
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

  public constructor(
    @inject(kRedis) public readonly redis: Redis,
    @inject(kRaids) public readonly manager: RaidManager
  ) {}

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    if (["create"].includes(subcommand)) {
      const inAfkChannel_ = await inAfkChannel(interaction);
      if (!inAfkChannel_) return;
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
    if (this.manager.channels.has(`channel:${interaction.user.id}`)) {
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
      veteran,
      "GUILD_VOICE"
    );

    await channel.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    const member = channel.guild.members.cache.get(interaction.user.id);

    const channelInfo: Omit<Channel, "messageId" | "location"> = {
      name: channel.name,

      guildId: interaction.guildId,
      channelId: interaction.channelId,
      voiceChannelId: channel.id,

      leaderId: interaction.user.id,
      leaderName: member?.displayName,
      leaderTag: interaction.user.tag,

      roleId: roleId,

      state: "LOCKED",
    };

    this.manager.emit("channelStart", channelInfo);
    await interaction.editReply({ content: "Created your channel." });
  }

  private async close(interaction: CommandInteraction): Promise<void> {
    if (!this.manager.channels.has(`channel:${interaction.user.id}`)) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = this.manager.channels.get(
      `channel:${interaction.user.id}`
    )!;

    const data: Channel = {
      ...channel,
      state: "CLOSED",
    };

    this.manager.emit("channelClose", data);
    this.manager.channels.set(`channel:${interaction.user.id}`, data);
    await interaction.editReply({ content: "Closed your channel." });
  }

  private async unlock(interaction: CommandInteraction): Promise<void> {
    if (!this.manager.channels.has(`channel:${interaction.user.id}`)) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = this.manager.channels.get(`channel:${interaction.user.id}`);
    if (channel?.state === "OPENED") {
      await interaction.editReply({
        content: "Channel is already opened.",
      });
      return;
    }

    const data: Channel = {
      ...channel!,
      state: "OPENED",
    };

    this.manager.emit("channelOpen", data);
    this.manager.channels.set(`channel:${interaction.user.id}`, data);
    await interaction.editReply({ content: "Opened your channel." });
  }

  private async lock(interaction: CommandInteraction): Promise<void> {
    if (!this.manager.channels.has(`channel:${interaction.user.id}`)) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = this.manager.channels.get(`channel:${interaction.user.id}`);
    if (channel?.state === "LOCKED") {
      await interaction.editReply({
        content: "Channel is already locked.",
      });
      return;
    }

    const data: Channel = {
      ...channel!,
      state: "LOCKED",
    };

    this.manager.emit("channelLocked", data);
    this.manager.channels.set(`channel:${interaction.user.id}`, data);
    await interaction.editReply({ content: "Opened your channel." });
  }

  private async cap(interaction: CommandInteraction) {
    if (!this.manager.channels.has(`channel:${interaction.user.id}`)) {
      await interaction.editReply({
        content: "Create a channel first.",
      });
      return;
    }

    const channel = this.manager.channels.get(`channel:${interaction.user.id}`);
    if (channel?.state === "LOCKED") {
      await interaction.editReply({
        content: "Channel is already locked.",
      });
      return;
    }

    const data: Channel = {
      ...channel!,
      state: "LOCKED",
    };

    this.manager.emit(
      "channelCapUpdate",
      data,
      interaction.options.getInteger("cap", true)
    );
    await interaction.editReply({ content: "Updated channel cap." });
  }
}
