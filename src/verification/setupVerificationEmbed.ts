import { Bot } from "@lib";
import {
  Guild,
  TextChannel,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} from "discord.js";

export async function setupVerificationEmbed(guild: Guild, channelId: string) {
  const client = guild.client as Bot;
  const channel = (await client.channels.fetch(channelId)) as TextChannel;

	// TODO: fetch guild requirements for verification
  const embed = new MessageEmbed()
    .setColor("ORANGE")
    .setTitle(`\`${guild.name} Verification\``)
    .setDescription(
      [
        "**Follow the steps below:**",
        "",
        "`1.` Make sure the bot can send you a **Direct Message**",
        "",
        "**Verification Requirements**",
        "• Not an alt.",
      ].join("\n")
    );
  const buttons = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("verify-button")
      .setLabel("verify me!")
      .setStyle("PRIMARY")
  );

  await channel.send({ embeds: [embed], components: [buttons] });
}
