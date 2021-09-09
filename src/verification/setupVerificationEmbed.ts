import {
  Guild,
  TextChannel,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { Bot } from "@lib";

export async function setupVerificationEmbed(guild: Guild, channelId: string) {
  const client = guild.client as Bot;
  const channel = (await guild.channels.fetch(channelId)) as TextChannel;

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

  const verificationMethod = (await client.guilds_db.get(guild.id))
    ?.verification_method;

  const options = { embeds: [embed] };
  if (verificationMethod === "manual") {
    embed.setDescription(
      "To verify, you must run the `/verify` command in this channel."
    );
    await channel.send(options);
  } else {
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("verify-button")
        .setLabel("verify me!")
        .setStyle("PRIMARY")
    );

    await channel.send({ ...options, components: [buttons] });
  }
}
