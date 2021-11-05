import { createChannel } from "@functions";
import { Database } from "@lib";
import { CommandInteraction, Snowflake, VoiceChannel } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kDatabase } from "../../../../tokens";

@injectable()
@Discord()
@SlashGroup("channel", "base for custom raiding channels")
export class ConfigCommand {
  private channels: Map<string, VoiceChannel>;
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = container.resolve<Database>(kDatabase)!;

    this.channels = new Map<Snowflake, VoiceChannel>();
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

    if (this.channels.has(interaction.user.id)) {
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

    this.channels.set(interaction.user.id, channel!);
    await interaction.editReply("created the channel");
  }

  @Slash("unlock", {
    description: "unlocks the channel",
  })
  private async unlock(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const channel = this.channels.get(interaction.user.id);

    if (!channel) {
      await interaction.editReply({
        content: "you do not have an existing raid channel, create one first",
      });
      return;
    }

    const cfg = await this.db.getGuild(interaction.guildId!);
    await channel.permissionOverwrites.edit(cfg.user_roles.main, {
      CONNECT: true,
    });

    await interaction.editReply("opened");
  }

  @Slash("lock", {
    description: "locks the channel",
  })
  private async lock(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const channel = this.channels.get(interaction.user.id);

    if (!channel) {
      await interaction.editReply({
        content: "you do not have an existing raid channel, create one first",
      });
      return;
    }

    const cfg = await this.db.getGuild(interaction.guildId!);
    await channel.permissionOverwrites.edit(cfg.user_roles.main, {
      CONNECT: false,
    });

    await interaction.editReply("locked");
  }

  @Slash("close", {
    description: "closes (deletes) the channel",
  })
  private async close(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const channel = this.channels.get(interaction.user.id);

    if (!channel) {
      await interaction.editReply({
        content: "you do not have an existing raid channel, create one first",
      });
      return;
    }

    await channel.delete();
    this.channels.delete(interaction.user.id);

    await interaction.editReply("closed");
  }
}
