import { bold, codeBlock, hyperlink, Embed } from "@discordjs/builders";
import { stripIndents } from "common-tags";
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";

const PROFILE_URL = (ign: string): string =>
  `https://www.realmeye.com/player/${ign}`;

export const awaitCodeEmbed = (ign: string, code: string) => {
  return new Embed()
    .setDescription(
      stripIndents`
    Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock("fix", code)}`
    )
    .setFooter({
      text: "You may need to wait for the api to catch updates. (1-2minutes)",
    });
};

export const code_missing = new Embed()
  .setDescription("Code not found in description.")
  .setFooter({ text: "If this issue persists, contact a staff member." });

export const verificationSuccessful = (
  member: GuildMember,
  ign: string,
  alt?: boolean
) => {
  return new MessageEmbed()
    .setColor("GREEN")
    .setFooter(
      `${member.user.tag} (${member.id})`,
      member.user.displayAvatarURL({ dynamic: true })
    )
    .setAuthor(
      `${alt ? "Added alt" : "Successfully verified"}: ${ign}`,
      "",
      PROFILE_URL(ign)
    );
};

export const awaitingVerificationCode = (ign: string, code: string) => {
  const embed = new MessageEmbed()
    .setDescription(
      stripIndents`
		Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock("fix", code)}`
    )
    .setFooter("You may need to wait for the api to catch updates.");

  const buttons = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("verification-continue-btn")
      .setLabel("Done")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId("verification-abort-btn")
      .setLabel("Cancel")
      .setStyle("DANGER"),
  ]);

  return { embeds: [embed], components: [buttons] };
};

export const failedAwaitingVerificationCode = (ign: string, code: string) => {
  const embed = new MessageEmbed()
    .setDescription(
      stripIndents`
    Code not found in any description.

		Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock("fix", code)}`
    )
    .setFooter("If the issue persists, contact a staff member.");

  const buttons = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("yes")
      .setLabel("I have added the code to my RealmEye description")
      .setStyle("SUCCESS"),
    new MessageButton().setCustomId("no").setLabel("Cancel").setStyle("DANGER"),
  ]);

  return { embeds: [embed], components: [buttons] };
};
