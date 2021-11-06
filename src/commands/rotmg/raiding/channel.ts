import { createChannel } from "@functions";
import { Database } from "@lib";
import {
  CommandInteraction,
  Formatters,
  MessageEmbed,
  Snowflake,
  VoiceChannel,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kDatabase } from "../../../../tokens";

// TODO: add templates with template command and add option to use templates

@injectable()
@Discord()
@SlashGroup("channel")
export class ConfigCommand {
  private raids: Map<string, CustomRaidChannelInfo>;
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = container.resolve<Database>(kDatabase)!;

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

    const { channels, user_roles } = await this.db.getGuild(
      interaction.guildId!
    );
    const channel = await createChannel(
      interaction.guild!,
      name,
      interaction.channelId === channels.vet_afk_check
    );

    await channel?.permissionOverwrites.edit(user_roles.main, {
      CONNECT: false,
    });

    const member = await channel?.guild.members.fetch(interaction.user.id)!;

    const embed = new MessageEmbed()
      .setAuthor(
        member.displayName!,
        member.user.displayAvatarURL({ dynamic: true })
      )
      .setColor(member.displayColor)
      .setDescription(`Channel started at ${Formatters.time(new Date(), "R")}`);

    await interaction.editReply("Created the channel");

    const m = await interaction.channel?.send({
      content: `@here ${name}`,
      embeds: [embed],
      allowedMentions: {
        parse: ["everyone"], // this only allows @here to be mentioned
      },
    });

    this.raids.set(interaction.user.id, {
      channel: channel!,
      msgId: m?.id!,
      roleId: user_roles.main,
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
      .setDescription(`Opened since ${Formatters.time(new Date(), "R")}`)
      .setColor("GREEN");

    await msg.edit({
      embeds: [embed],
    });
  }

  @Slash("lock", {
    description: "Closes the channel",
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
      .setDescription(`Locked since ${Formatters.time(new Date(), "R")}`)
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
      .setDescription(`Closed since ${Formatters.time(new Date(), "R")}`);

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
