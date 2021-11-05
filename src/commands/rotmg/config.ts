import { Database } from "@lib";
import {
  CategoryChannel,
  CommandInteraction,
  Constants,
  GuildChannel,
  MessageEmbed,
  Role,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kDatabase } from "../../tokens";

@injectable()
@Discord()
@SlashGroup("config", "config group description", {
  channel: "channel group description",
  category: "category group description",
  "user-roles": "user_roles group description",
})
export class ConfigCommand {
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = container.resolve<Database>(kDatabase);
  }

  @SlashGroup("channel")
  @Slash("afk-check")
  private async afk_check(
    @SlashOption("channel", {
      required: true,
      // @ts-ignore
      type: "CHANNEL",
      // @ts-ignore
      channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
      description: "the main afk check channel",
    })
    channel: GuildChannel,
    interaction: CommandInteraction
  ) {
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

  @SlashGroup("channel")
  @Slash("vet-afk-check")
  private async vet_afk_check(
    @SlashOption("channel", {
      required: true,
      // @ts-ignore
      type: "CHANNEL",
      // @ts-ignore
      channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
      description: "the veteran afk check channel",
    })
    channel: GuildChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      channels: { vet_afk_check },
    } = await this.db.getGuild(guildId);

    const mention = channel.toString();
    if (vet_afk_check === channel.id) {
      await interaction.editReply(
        `❌ vet_afk_check is already set to ${mention}`
      );
      return;
    }

    await this.db.setGuildKey(guildId, "channels.vet_afk_check", channel.id);
    await interaction.editReply(`☑️ updated vet_afk_check to ${mention}`);
  }

  @SlashGroup("category")
  @Slash("main")
  private async category_main(
    @SlashOption("channel", {
      required: true,
      // @ts-ignore
      type: "CHANNEL",
      // @ts-ignore
      channelTypes: [Constants.ChannelTypes.GUILD_CATEGORY],
      description: "category for the main section",
    })
    channel: CategoryChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      categories: { main },
    } = await this.db.getGuild(guildId);

    const mention = channel.toString();
    if (main === channel.id) {
      await interaction.editReply(
        `❌ main category is already set to ${mention}`
      );
      return;
    }

    await this.db.setGuildKey(guildId, "categories.main", channel.id);
    await interaction.editReply(`☑️ updated main category to ${mention}`);
  }

  @SlashGroup("category")
  @Slash("veteran")
  private async category_veteran(
    @SlashOption("channel", {
      required: true,
      // @ts-ignore
      type: "CHANNEL",
      // @ts-ignore
      channelTypes: [Constants.ChannelTypes.GUILD_CATEGORY],
      description: "category for the veteran section",
    })
    channel: CategoryChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      categories: { veteran },
    } = await this.db.getGuild(guildId);

    const mention = channel.toString();
    if (veteran === channel.id) {
      await interaction.editReply(
        `❌ veteran category is already set to ${mention}`
      );
      return;
    }

    await this.db.setGuildKey(guildId, "categories.veteran", channel.id);
    await interaction.editReply(`☑️ updated veteran category to ${mention}`);
  }

  @SlashGroup("user-roles")
  @Slash("main")
  private async user_roles_main(
    @SlashOption("role", {
      required: true,
      type: "ROLE",
      description: "the main raider role",
    })
    role: Role,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      user_roles: { main },
    } = await this.db.getGuild(guildId);

    const mention = role.toString();
    if (role.id === main) {
      await interaction.editReply(
        `❌ main user_role is already set to ${mention}`
      );
      return;
    }

    await this.db.setGuildKey(guildId, "user_roles.main", role.id);
    await interaction.editReply(`☑️ updated the main user_role to ${mention}`);
  }

  @SlashGroup("user-roles")
  @Slash("veteran")
  private async veteran(
    @SlashOption("role", {
      required: true,
      type: "ROLE",
      description: "the veteran raider role",
    })
    role: Role,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;

    const {
      user_roles: { veteran },
    } = await this.db.getGuild(guildId);

    const mention = role.toString();
    if (role.id === veteran) {
      await interaction.editReply({
        content: `❌ veteran user_role is already set to ${mention}`,
      });
      return;
    }

    await this.db.setGuildKey(guildId, "user_roles.veteran", role.id);
    await interaction.editReply(
      `☑️ updated the veteran user_role to ${mention}`
    );
  }

  @Slash("view", { description: "view the current server config." })
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

    const user_roles = Object.keys(cfg.user_roles)
      .map(
        (r) =>
          `${r} | ${
            Reflect.get(cfg.user_roles, r)
              ? `<@&${Reflect.get(cfg.user_roles, r)}>`
              : "n/a"
          }`
      )
      .join("\n");

    embed.setFields([
      {
        name: "channels",
        value: channels,
      },
      {
        name: "user_roles",
        value: user_roles,
      },
    ]);

    await interaction.reply({
      embeds: [embed],
    });
  }
}
