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
  // TODO: removed for now
  //@Slash("view", { description: "view the current server config." })
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
