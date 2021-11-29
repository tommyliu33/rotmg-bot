import { bold, codeBlock, hyperlink } from "@discordjs/builders";
import { stripIndents } from "common-tags";
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";

const PROFILE_URL = (ign: string): string =>
  `https://www.realmeye.com/player/${ign}`;

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
      "https://www.realmeye.com/player/" + ign
    );
};

export const awaitingVerificationCode = (ign: string, code: string) => {
  const embed = new MessageEmbed().setDescription(
    stripIndents`
		Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock(code)}
    Once you are done, click on one of the following buttons.
		${bold("You may need to wait for the API to catch updates.")}`
  );

  const buttons = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("verification-continue-btn")
      .setLabel("I have added the code to my RealmEye description")
      .setStyle("SUCCESS"),
    new MessageButton().setCustomId("verification-abort-btn").setLabel("Cancel").setStyle("DANGER"),
  ]);

  return { embeds: [embed], components: [buttons] };
};

export const failedAwaitingVerificationCode = (ign: string, code: string) => {
  const embed = new MessageEmbed()
    .setDescription(
      stripIndents`
		Seems like the code was not found in any description.

		Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock(code)}
		${bold("You may need to wait for the API to catch updates.")}`
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
