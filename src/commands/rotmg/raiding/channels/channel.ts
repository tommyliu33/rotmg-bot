import { createChannel } from "@functions";
import { Database } from "@lib";
import {
  CommandInteraction,
  MessageEmbed,
  Snowflake,
  VoiceChannel,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kDatabase } from "../../../../tokens";

@injectable()
@Discord()
@SlashGroup("channel", "base for custom raiding channels")
export class ConfigCommand {
  private raids: Map<string, CustomRaidChannelInfo>;
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = container.resolve<Database>(kDatabase)!;

    this.raids = new Map();
  }

  @Slash("create", {
    description: "create a raiding channel",
  })
  private async create(
    @SlashOption("name", {
      description: "name of the channel",
      type: "STRING",
      required: true,
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();

    const cfg = await this.db.getGuild(interaction.guildId!);

    if (this.raids.has(interaction.user.id)) {
      await interaction.editReply({
        content:
          "you already have a channel open, close it before opening another",
      });
      return;
    }

    const channel = await createChannel(
      interaction.guild!,
      name,
      interaction.channelId === cfg.channels.vet_afk_check
    );

    // lock the channel
    await channel?.permissionOverwrites.edit(cfg.user_roles.main, {
      CONNECT: false,
    });

    const embed = new MessageEmbed()
      .setAuthor(name, interaction.user.displayAvatarURL({ dynamic: true }))
      .setColor("RANDOM");

    const m = await interaction.editReply({
      embeds: [embed],
    });

    this.raids.set(interaction.user.id, {
      channel: channel!,
      msg: m.id,
    });
  }

  @Slash("unlock", {
    description: "unlocks the channel",
  })
  private async unlock(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const raid = this.raids.get(interaction.user.id);

    if (!raid || !raid.channel) {
      await interaction.editReply({
        content: "you do not have an existing raid channel, create one first",
      });
      return;
    }

    const cfg = await this.db.getGuild(interaction.guildId!);
    await raid.channel.permissionOverwrites.edit(cfg.user_roles.main, {
      CONNECT: true,
    });

    const msg = await interaction.channel?.messages.fetch(raid.msg);

    // rebuild just in case
    const embed = new MessageEmbed(msg?.embeds[0]);
    await interaction.editReply({
      content: "opened",
      embeds: [embed],
    });
  }

  @Slash("lock", {
    description: "locks the channel",
  })
  private async lock(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const raid = this.raids.get(interaction.user.id);

    if (!raid || !raid.channel) {
      await interaction.editReply({
        content: "you do not have an existing raid channel, create one first",
      });
      return;
    }

    const cfg = await this.db.getGuild(interaction.guildId!);
    await raid.channel.permissionOverwrites.edit(cfg.user_roles.main, {
      CONNECT: false,
    });

    const msg = await interaction.channel?.messages.fetch(raid.msg);

    // rebuild just in case
    const embed = new MessageEmbed(msg?.embeds[0]);
    await interaction.editReply({
      content: "locked",
      embeds: [embed],
    });
  }

  @Slash("close", {
    description: "closes (deletes) the channel",
  })
  private async close(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const raid = this.raids.get(interaction.user.id);

    if (!raid || !raid.channel) {
      await interaction.editReply({
        content: "you do not have an existing raid, create one first",
      });
      return;
    }

    await raid.channel.delete();
    this.raids.delete(interaction.user.id);

    const msg = await interaction.channel?.messages.fetch(raid.msg);

    // rebuild just in case
    const embed = new MessageEmbed(msg?.embeds[0]);
    await interaction.editReply({
      content: "channel has been closed.",
      embeds: [embed],
    });
  }
}

interface CustomRaidChannelInfo {
  channel: VoiceChannel;
  msg: Snowflake;
}
