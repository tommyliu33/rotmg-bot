import { channelMention, codeBlock, roleMention } from "@discordjs/builders";
import type { PrismaClient } from "@prisma/client";
import { stripIndents } from "common-tags";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { container } from "tsyringe";
import { kPrisma } from "../../../tokens";

const map = {
  main_section_id: {
    name: "Main section",
    description: "The main raiding section",
  },
  afk_check_channel_id: {
    name: "Afk check channel",
    description: "The main afk check channel",
  },

  veteran_section_id: {
    name: "Veteran section",
    description: "The veteran raiding section",
  },
  vet_afk_check_channel_id: {
    name: "Veteran afk check channel",
    description: "The veteran afk check channel",
  },

  verified_role_id: {
    name: "Verified raider",
    description: "The verified raider role",
  },
  veteran_role_id: {
    name: "Veteran raider",
    description: "The veteran raider role",
  },

  log_channel_id: { name: "Log channel", description: "The log channel" },
};

const roles = ["verified_role_id", "veteran_role_id"];
const sections = ["main_section_id", "veteran_section_id"];
const channels = [
  "afk_check_channel_id",
  "vet_afk_check_channel_id",
  "log_channel_id",
];

@Discord()
@SlashGroup("config")
export abstract class ConfigViewCommand {
  @Slash("view")
  private async execute(interaction: CommandInteraction): Promise<void> {
    const prisma = container.resolve<PrismaClient>(kPrisma);
    const data = await prisma.guilds.findFirst({
      where: {
        id_: interaction.guildId,
      },
    });

    const embed = new MessageEmbed()
      .setAuthor(
        interaction.guild?.name!,
        interaction.guild?.iconURL({ dynamic: true }) ?? ""
      )
      .setColor("DARK_AQUA");

    let value_ = "";
    for (const key of Object.keys(map)) {
      const value = Reflect.get(data!, key);
      const { name, description } = Reflect.get(map, key);

      if (roles.includes(key)) {
        value_ = value === "" || !value ? "not set" : roleMention(value);
      } else if (sections.includes(key)) {
        value_ =
          (await interaction.guild?.channels.fetch(value))?.name ?? "not set";
      } else if (channels.includes(key)) {
        value_ = value === "" || !value ? "not set" : channelMention(value);
      }

      embed.addField(
        name,
        stripIndents`
    ${codeBlock(description)}
    ${value_}`,
        true
      );
    }

    await interaction.reply({ embeds: [embed] });
  }
}
