import { stripIndents } from "common-tags";
import { GuildMember, MessageEmbed } from "discord.js";
import type { Dungeon } from "../dungeons";

const buildAfkCheckEmbedDescription = (dungeon: Dungeon): string => {
  const { portal, keys, optional_reacts, rusher } = dungeon;

  /*const description = [
    `To join, ${bold(
      "connect to the raiding channel"
    )} and then react to ${portal}`,
    `If you have ${
      keys.length === 4
        ? "runes/inc"
        : keys.length === 2
        ? "a key/vial"
        : "a key"
    } and are willing to pop, react to ${keys.map((k) => k.emote).join("")}`,
    "",
    "To indicate class or gear choices, react below",
    "",
  ];*/

  const description = [
    `To participate, join the voice channel and then react with ${portal}`,
    `If you have ${
      keys.length === 4
        ? "runes/inc"
        : keys.length === 2
        ? "a key/vial"
        : "a key"
    } and are willing to pop, react to ${keys.map((k) => k.emote).join("")}`,
    "",
    "To indicate class or gear choices, react below",
    "",
  ];

  if (optional_reacts && optional_reacts?.length >= 1) {
    description.pop();
    description.push(
      `Please bring one of these items if you can: ${optional_reacts
        ?.map((c) => c.emote)
        .join("")}`
    );
  }

  description.push("");
  if (rusher) {
    description.push(
      `If you can rush ${
        dungeon.name === "shatters"
          ? "monuments"
          : dungeon.name === "cult"
          ? "pots"
          : ""
      }, react with ${rusher.emote}`
    );
  }

  // TOOD: better way
  if (dungeon.name === "shatters") {
    description.push(
      "If you can do the Lights Out puzzle, react with <:LightsOutPuzzle:908439164087840819>\n\n"
    );
  } else description.push("");

  return description.join("\n");
};

export function afkCheckEmbed(dungeon: Dungeon): MessageEmbed {
  const { images, color } = dungeon;

  const thumbnail = images[Math.floor(Math.random() * images.length)];

  return new MessageEmbed()
    .setThumbnail(thumbnail)
    .setColor(color)
    .setDescription(buildAfkCheckEmbedDescription(dungeon));
}

export function verification_private_profile() {
  return new MessageEmbed()
    .setColor("RED")
    .addField(
      "\u200b",
      "Your RealmEye profile is **private**, please set it to public for the verification process."
    );
}

export function verification_successful(member: GuildMember, ign: string) {
  return new MessageEmbed()
    .setColor("GREEN")
    .setFooter(
      `${member.user.tag} (${member.id})`,
      member.user.displayAvatarURL({ dynamic: true })
    )
    .setAuthor(
      `Successfully verified: ${ign}`,
      "",
      "https://www.realmeye.com/player/" + ign
    );
}
