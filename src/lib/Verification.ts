import { Bot, Player } from "@lib";
import { APIInteractionGuildMember, ButtonStyle } from "discord-api-types/v9";
import {
  Guild,
  GuildMember,
  MessageEmbed,
  TextChannel,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import petitio from "petitio";

/* see https://github.com/Nightfirecat/RealmEye-API */
const api = "https://nightfirec.at/realmeye-api/";

// TODO: Refactor

/* manages user verification */
export class Verification {
  public readonly client!: Bot;
  public constructor(client: Bot) {
    Object.defineProperty(this, "client", { value: client });
  }

  public async fetch_player_data(name: string): Promise<Player | void> {
    const req = await petitio(`${api}?player=${name}`).send();

    if (req.statusCode?.toString().startsWith("4")) {
      console.log(`An error occured while trying to fetch player data.`);
      return;
    } else {
      // @ts-ignore
      if (req.error) {
        console.log(`An error occured while trying to fetch player data.`);
        return;
      }

      const player: Player = await req.json();
      return player;
    }
  }

  /* return whether the verification was successful */
  public async verify_player(
    member: APIInteractionGuildMember | GuildMember,
    guild: Guild,
    name: string
  ): Promise<boolean> {
    /* they exist */
    if (await this.fetch_player_data(name)) {
      const client = guild.client as Bot;

      const role_id = (await client.guilds_db.get(
        guild.id,
        "verified_role"
      )) as string;

      if (!(member instanceof GuildMember)) {
        member = await guild.members.fetch(member.user.id);
      }

      /* assume they are verifying under another name */
      if (member.roles.cache.has(role_id)) {
        await member.setNickname(`${member.nickname} | ${name}`);
        return true;
      }
      await member.roles.add(role_id);

      return true;
    } else {
      return false;
    }
  }

  public async setup_embed(verification_channel: string) {
    const channel = (await this.client.channels.fetch(
      verification_channel
    )) as TextChannel;
    const { guild } = channel;

    const embed = new MessageEmbed()
      .setTitle(`\`${guild.name} verification\``)
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
}
