import {
  CategoryChannel,
  CommandInteraction,
  Constants,
  GuildChannel,
  MessageEmbed,
  Role,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import {
  getGuildSetting,
  SettingsKey,
} from "../../functions/settings/getGuildSetting";
import { setGuildSetting } from "../../functions/settings/setGuildSetting";

@Discord()
@SlashGroup("config", "config group description", {
  channel: "channel group description",
  category: "category group description",
  "user-roles": "user_roles group description",
})
export abstract class ConfigCommand {
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

    const afkCheck = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.AfkCheck
    );

    const mention = channel.toString();
    if (afkCheck === channel.id) {
      await interaction.editReply(`❌ afk_check is already set to ${mention}`);
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.AfkCheck,
      channel.id
    );
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

    const vetAfkCheck = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck
    );

    const mention = channel.toString();
    if (vetAfkCheck === channel.id) {
      await interaction.editReply(
        `❌ vet_afk_check is already set to ${mention}`
      );
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck,
      channel.id
    );
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

    const mainCategory = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.MainCategory
    );

    const mention = channel.toString();
    if (mainCategory === channel.id) {
      await interaction.editReply(
        `❌ main category is already set to ${mention}`
      );
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.MainCategory,
      channel.id
    );
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

    const vetCategory = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetCategory
    );

    const mention = channel.toString();
    if (vetCategory === channel.id) {
      await interaction.editReply(
        `❌ veteran category is already set to ${mention}`
      );
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.VetCategory,
      channel.id
    );
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

    const mainRole = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.MainUserRole
    );

    const mention = role.toString();
    if (mainRole === role.id) {
      await interaction.editReply(
        `❌ main user_role is already set to ${mention}`
      );
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.MainUserRole,
      role.id
    );
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

    const vetUserRole = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetUserRole
    );

    const mention = role.toString();
    if (vetUserRole === role.id) {
      await interaction.editReply({
        content: `❌ veteran user_role is already set to ${mention}`,
      });
      return;
    }

    await setGuildSetting(
      interaction.guildId!,
      SettingsKey.VetUserRole,
      role.id
    );
    await interaction.editReply(
      `☑️ updated the veteran user_role to ${mention}`
    );
  }

  // TODO: removed for now
  @Slash("view", { description: "view the current server config." })
  private async view(interaction: CommandInteraction): Promise<void> {
    /*const embed = new MessageEmbed();
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

    // rip
    const categories = await (
      await Promise.all(
        Object.keys(cfg.categories).map(
          async (c) =>
            `${c} | ${
              Reflect.get(cfg.categories, c)
                ? (
                    await interaction.guild?.channels.fetch(
                      Reflect.get(cfg.categories, c)
                    )
                  )?.name
                : "n/a"
            }`
        )
      )
    ).join("\n");

    embed.setFields([
      {
        name: "channels",
        value: channels,
        inline: true,
      },
      {
        name: "user_roles",
        value: user_roles,
        inline: true,
      },
      {
        name: "categories",
        value: categories,
        inline: true,
      },
    ]);

    await interaction.reply({
      embeds: [embed],
    });*/
    await interaction.reply("sadge");
  }
}
