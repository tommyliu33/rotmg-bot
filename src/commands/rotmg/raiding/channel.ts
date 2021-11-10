import { createChannel } from "@functions";
import {
  CommandInteraction,
  Formatters,
  MessageEmbed,
  Snowflake,
  VoiceChannel,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import {
  getGuildSetting,
  SettingsKey,
} from "../../../functions/settings/getGuildSetting";

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) : str;

// TODO: add templates with template command and add option to use templates

@injectable()
@Discord()
@SlashGroup("channel")
export class ConfigCommand {
  private raids: Map<string, CustomRaidChannelInfo>;
  public constructor() {
    this.raids = new Map();
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
    await interaction.deferReply({ ephemeral: true });

    if (this.raids.has(interaction.user.id)) {
      await interaction.editReply("Close your previous channel first");
      return;
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
      .setTitle(`Channel ${Formatters.inlineCode(channelName)}`)
      .setDescription(`Join ${channel?.toString()} to participate`)
      .addField(
        "Status",
        `Channel started at ${Formatters.time(new Date(), "T")}`
      );

    await interaction.editReply("Created the channel");

    const m = await interaction.channel?.send({
      content: "@here",
      embeds: [embed],
      allowedMentions: {
        parse: ["everyone"],
      },
    });

    this.raids.set(interaction.user.id, {
      channel: channel!,
      msgId: m?.id!,
      roleId,
      state: "LOCKED",
    });
  }

  @Slash("open", {
    description: "Opens the channel",
  })
  private async open(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const raid = this.raids.get(interaction.user.id);
    if (!raid) {
      await interaction.editReply({
        content: "Create a channel first",
      });
      return;
    }

    const { channel, msgId, roleId, state } = raid;
    if (state === "OPENED") {
      await interaction.editReply("Channel is already opened");
      return;
    }

    await channel.permissionOverwrites.edit(roleId, {
      CONNECT: true,
    });

    this.raids.set(interaction.user.id, { ...raid, state: "OPENED" });

    await interaction.editReply("Opened the channel");

    const msg = await interaction.channel?.messages.fetch(msgId);
    if (!msg) return;

    const embed = new MessageEmbed(msg.embeds[0])
      .setFields([])
      .setDescription(`Join ${channel.toString()} to participate`)
      .addField("Status", `Opened at ${Formatters.time(new Date(), "T")}`)
      .setColor("GREEN");

    const m = await msg.channel.send({
      content: `@here Channel ${Formatters.inlineCode(
        channel.name
      )} has opened (re-ping)`,
      allowedMentions: {
        parse: ["everyone"],
      },
    });
    await m.delete();

    await msg.edit({
      embeds: [embed],
    });
  }

  @Slash("lock", {
    description: "Locks the channel",
  })
  private async lock(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const raid = this.raids.get(interaction.user.id);
    if (!raid) {
      await interaction.editReply("Create a channel first");
      return;
    }

    const { channel, msgId, roleId, state } = raid;
    if (state === "LOCKED") {
      await interaction.editReply("Channel is already locked");
      return;
    }

    this.raids.set(interaction.user.id, { ...raid, state: "LOCKED" });
    await channel.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    await interaction.editReply("Locked the channel");

    const msg = await interaction.channel?.messages.fetch(msgId);
    if (!msg) return;

    const embed = new MessageEmbed(msg.embeds[0])
      .setFields([])
      .setDescription("Please wait for the channel to open")
      .addField("Status", `Locked at ${Formatters.time(new Date(), "T")}`)
      .setColor("YELLOW");

    await msg.edit({
      embeds: [embed],
    });
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
    await interaction.deferReply({ ephemeral: true });
    const raid = this.raids.get(interaction.user.id);

    if (!raid || !raid.channel) {
      await interaction.editReply("Create a channel first");
      return;
    }

    const { channel } = raid;
    await channel.setUserLimit(number);

    await interaction.editReply(`Edited channel cap to ${number} users`);
  }

  @Slash("delete", {
    description: "Removes the channel",
  })
  private async delete(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const raid = this.raids.get(interaction.user.id);

    if (!raid || !raid.channel) {
      await interaction.editReply("Create a channel first");
      return;
    }

    const { channel, msgId } = raid;
    await channel.delete();

    await interaction.editReply({
      content: "Channel has been closed",
    });

    const msg = await interaction.channel?.messages.fetch(msgId);
    this.raids.delete(interaction.user.id);
    if (!msg) return;

    const embed = new MessageEmbed(msg.embeds[0])
      .setColor("RED")
      .setDescription(`Closed at ${Formatters.time(new Date(), "T")}`);

    await msg.edit({
      content: "This raid has finished.",
      embeds: [embed],
    });
  }
}

interface CustomRaidChannelInfo {
  channel: VoiceChannel;
  roleId: Snowflake;
  msgId: Snowflake;
  state: "LOCKED" | "OPENED";
}
