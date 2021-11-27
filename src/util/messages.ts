import { bold, codeBlock, hyperlink } from "@discordjs/builders";
import { stripIndents } from "common-tags";
import {
  MessageOptions,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";

const PROFILE_URL = (ign: string): string =>
  `https://www.realmeye.com/player/${ign}`;

export const verificationAborted = stripIndents`
Could not find your verification info, you may need to restart.

If you accidently cancelled the verification process, run the command to start again.

${bold("NOTE THAT THE PREVIOUS CODE IS NOW INVALIDATED!")}
`;

export function awaitingVerificationCode(
  ign: string,
  code: string
): MessageOptions {
  const embed = new MessageEmbed().setDescription(
    stripIndents`
		Add the code to any line of your ${hyperlink(
      "Realmeye description",
      PROFILE_URL(ign)
    )}: ${codeBlock(code)}
		${bold("You may need to wait for the API to catch updates.")}`
  );

  const buttons = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("yes")
      .setLabel("I have added the code to my RealmEye description")
      .setStyle("SUCCESS"),
    new MessageButton().setCustomId("no").setLabel("Cancel").setStyle("DANGER"),
  ]);

  return { embeds: [embed], components: [buttons] };
}

export function failedAwaitingVerificationCode(
  ign: string,
  code: string
): MessageOptions {
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
}
