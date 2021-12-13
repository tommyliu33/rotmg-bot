import { Command } from "@struct";
import type { CommandInteraction } from "discord.js";

import { getGuildSetting, setGuildSetting, SettingsKey } from "@functions";
import {
  Embed,
  inlineCode,
  channelMention,
  roleMention,
} from "@discordjs/builders";

import { inject, injectable } from "tsyringe";
import { kRedis } from "../../tokens";
import type { Redis } from "ioredis";

@injectable()
export default class implements Command {
  public name = "config";
  public description = "config command";
  public options = [
    {
      name: "view",
      description: "view the server config.",
      type: 1,
    },
    {
      name: "edit",
      description: "edit the server config.",
      options: [
        {
          name: "verified_role",
          description: "the main user role",
          type: 8,
        },
        {
          name: "veteran_role",
          description: "the veteran raider role",
          type: 8,
        },
        {
          name: "raid_leader",
          description: "the raid leader role",
          type: 8,
        },
        {
          name: "vet_raid_leader",
          description: "the veteran leader role",
          type: 8,
        },
        {
          name: "afk_check",
          description: "the afk check channel",
          type: 7,
          channel_types: [0],
        },
        {
          name: "vet_afk_check",
          description: "the veteran afk check channel",
          type: 7,
          channel_types: [0],
        },
        {
          name: "main_section",
          description: "the main raiding section",
          type: 7,
          channel_types: [4],
        },
        {
          name: "veteran_section",
          description: "the veteran raiding section",
          type: 7,
          channel_types: [4],
        },
      ],
      type: 1,
    },
  ];

  public constructor(@inject(kRedis) public readonly redis: Redis) {}

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const { guildId, options } = interaction;
    if (interaction.options.getSubcommand() === "view") {
      const afkCheck = await getGuildSetting(guildId, SettingsKey.AfkCheck);
      const vetAfkCheck = await getGuildSetting(
        guildId,
        SettingsKey.VetAfkCheck
      );

      const mainSection = await getGuildSetting(
        guildId,
        SettingsKey.MainSection
      );
      const veteranSection = await getGuildSetting(
        guildId,
        SettingsKey.VetSection
      );

      const verifiedRole = await getGuildSetting(
        guildId,
        SettingsKey.MainUserRole
      );
      const veteranRole = await getGuildSetting(
        guildId,
        SettingsKey.VetUserRole
      );

      const raidLeaderRole = await getGuildSetting(
        guildId,
        SettingsKey.RaidLeaderRole
      );
      const vetLeaderRole = await getGuildSetting(
        guildId,
        SettingsKey.VetRaidLeaderRole
      );

      const embed = new Embed()
        .setTitle(`${inlineCode(interaction.guild?.name as string)} Config`)
        .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) ?? null)
        .setDescription("Use `/config edit` to change these values.")
        .addField({
          name: inlineCode("Afk check channel"),
          value: afkCheck ? channelMention(afkCheck) : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Vet Afk check channel"),
          value: vetAfkCheck ? channelMention(vetAfkCheck) : "❌",
          inline: true,
        })
        .addField({
          name: "\u200b",
          value: "\u200b",
          inline: true,
        })
        .addField({
          name: inlineCode("Main section"),
          value: mainSection
            ? (interaction.guild?.channels.cache.get(mainSection)
                ?.name as string)
            : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Veteran section"),
          value: veteranSection
            ? (interaction.guild?.channels.cache.get(veteranSection)
                ?.name as string)
            : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Verified role"),
          value: verifiedRole ? roleMention(verifiedRole) : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Veteran role"),
          value: veteranRole ? roleMention(veteranRole) : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Raid leader role"),
          value: raidLeaderRole ? roleMention(raidLeaderRole) : "❌",
          inline: true,
        })
        .addField({
          name: inlineCode("Veteran leader role"),
          value: vetLeaderRole ? roleMention(vetLeaderRole) : "❌",
          inline: true,
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const options_ = options.data[0].options;
    if (!options_?.length) {
      await interaction.editReply({
        content: "You need to provide a setting to edit.",
      });
      return;
    }

    let key: SettingsKey;
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < options_.length; ++i) {
      const { name, value } = options_[i];
      switch (name) {
        // #region roles
        case "verified_role":
          key = SettingsKey.MainUserRole;
          break;
        case "veteran_role":
          key = SettingsKey.VetUserRole;
          break;
        case "raid_leader":
          key = SettingsKey.RaidLeaderRole;
          break;
        case "vet_raid_leader":
          key = SettingsKey.VetRaidLeaderRole;
          break;
        // #endregion
        // #region sections
        case "main_section":
          key = SettingsKey.MainSection;
          break;
        case "veteran_section":
          key = SettingsKey.VetSection;
          break;
        // #endregion
        // #region channels
        case "afk_check":
          key = SettingsKey.AfkCheck;
          break;
        case "vet_afk_check":
          key = SettingsKey.VetAfkCheck;
          break;
        // #endregion
      }
      await setGuildSetting(guildId, key!, value);
    }

    await interaction.editReply({ content: "Done." });
  }
}
