import { Database } from "@lib";
import {
  CommandInteraction,
  Constants,
  GuildChannel,
  MessageEmbedOptions,
  MessageEmbed,
  Role,
} from "discord.js";
import { Discord, DIService, Slash, SlashGroup, SlashOption } from "discordx";
import { inject, injectable } from "tsyringe";
import { kDatabase } from "../../tokens";

@injectable()
@Discord()
@SlashGroup("config", "edit server config.")
export class ConfigCommand {
  // weird
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = DIService.container?.resolve(Database)!;
  }

  @Slash("view", {
    description: "view server config.",
  })
  private async view(interaction: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed();
    const cfg = await this.db.getGuild(interaction.guildId!);

    const channels = Object.keys(cfg.channels)
      .map(
        (c) =>
          `${c} | ${
            Reflect.get(cfg.channels, c)
              ? `<#${Reflect.get(cfg.channels, c)}>`
              : "n/a"
          }`
      )
      .join("\n");

    embed.setFields([
      {
        name: "channels",
        value: channels,
      },
    ]);

    await interaction.reply({
      embeds: [embed],
    });
  }

  @Slash("role", { description: "the main raiding role" })
  private async role(
    @SlashOption("role", {
      type: "ROLE",
      description: "role to add when a user is verified",
      required: true,
    })
    role: Role,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();
    await interaction.editReply(`role is ${role.toString()}`);
  }

  @Slash("afkcheck", { description: "afk check channel" })
  private async afkCheck(
    @SlashOption("channel", {
      description: "channel to use",
      // bad typings but still works fine
      // @ts-ignore
      channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
      // @ts-ignore
      type: "CHANNEL",
      required: true,
    })
    channel: GuildChannel,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      channels: { afk_check },
    } = await this.db.getGuild(guildId);

    const mention = channel.toString();
    if (afk_check === channel.id) {
      await interaction.editReply(`❌ afk_check is already set to ${mention}`);
      return;
    }

    await this.db.setGuildKey(guildId, "channels.afk_check", channel.id);
    await interaction.editReply(`☑️ updated afk_check to ${mention}`);
  }
}
