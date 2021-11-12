import { createChannel } from "@functions";
import {
  CommandInteraction,
  Formatters,
  MessageEmbed,
  VoiceChannel,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import {
  getGuildSetting,
  SettingsKey,
} from "../../../functions/settings/getGuildSetting";
import { kRedis } from "../../../tokens";

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) : str;

// TODO: add guards so channel/afkcheck can only be ran in the corresponding afk check chanenls
// TODO: add templates with template command and add option to use templates

@injectable()
@Discord()
@SlashGroup("channel")
export class Command {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @Slash("create", {
    description: "Create a raiding channel with a custom name and template",
  })
  private async create(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the channel",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const active = await this.redis.get(`channel:${interaction.user.id}`);
    if (active) {
      return interaction.reply({
        content: "Close your current channel before starting another.",
        ephemeral: true,
      });
    }

    const roleId = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.MainUserRole
    );
    const vetChannelId = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck
    );

    const channelName = truncate(name, 100);
    const channel = await createChannel(
      interaction.guild!,
      channelName,
      interaction.channelId === vetChannelId
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
    };
    this.redis.set(`channel:${interaction.user.id}`, JSON.stringify(raid));
  }

  @Slash("open", {
    description: "Opens the channel",
  })
  private async open(interaction: CommandInteraction): Promise<void> {
    const active = await this.redis.get(`channel:${interaction.user.id}`);
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

    await this.redis.set(
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

  @Slash("lock", {
    description: "Locks the channel",
  })
  private async lock(interaction: CommandInteraction): Promise<void> {
    const active = await this.redis.get(`channel:${interaction.user.id}`);
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

    await this.redis.set(
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
        content: "Channel cap must be greater than 0 but less than 100.",
        ephemeral: true,
      });
    }

    if (number === 0) {
      return interaction.reply({
        content: "Removed the channel cap.",
        ephemeral: true,
      });
    } else {
      await channel?.setUserLimit(number);
      return interaction.reply({
        content: `Changed channel cap to ${number} users.`,
        ephemeral: true,
      });
    }
  }

  @Slash("delete", {
    description: "Deletes the channel",
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

    await channel?.delete();
    await interaction.reply({
      content: "Closed and deleted the channel.",
      ephemeral: true,
    });

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
  }
}
