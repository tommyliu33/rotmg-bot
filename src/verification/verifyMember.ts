import { Bot } from "@lib";
import type { APIInteractionGuildMember } from "discord-api-types/v9";
import { Guild, GuildMember } from "discord.js";

export enum VerificationStatus {
  // bad
  FAILED = 0,
  INVALID_SETUP = -1,

  // good
  SUCCESSFUL = 1,
  ALREADY_VERIFIED = 2,
}

/**
 * verify a raider
 * @param member member to verify
 * @param name if the name is not given -> assume they have only one saved name and use that
 */
export async function verifyMember(
  member: APIInteractionGuildMember | GuildMember,
  guild: Guild,
  name?: string
): Promise<VerificationStatus> {
  const client = guild.client as Bot;

  const users = await client.users_db.all();
  const target = users.find((c) => c.ID === member.user.id);

  /* a name to verify is given */
  if (name) {
    /* user already has the nick set */
    if (users.find((c) => c.data.names.includes(name))) {
      return VerificationStatus.ALREADY_VERIFIED;
    } else {
      /* if they provided a name not saved in db */
      if (target) {
        await client.users_db.push(member.user.id, name, "names");
      } else {
        /* first time verifying and they provide a name */
        await client.users_db.set(member.user.id, { names: [] });
        await client.users_db.push(member.user.id, name, "names");
      }
    }
  } else {
    /*
       const names = to_verify?.data?.names!;
  
       if (names) {
         const menu = new MessageActionRow().addComponents(
           new MessageSelectMenu()
             .setCustomId("select-ign-to-verify")
             .addOptions(names.map((c) => ({ label: c, value: c })))
         );
  
         const embed = new MessageEmbed().setDescription(
           "Select a name to verify as."
         );
  
         await ctx.interaction.editReply({
           embeds: [embed],
           components: [menu],
         });
       }
  
       // TODO: goto dms and setup
       if (!to_verify) {
         await ctx.interaction.editReply("you are here.");
       }
      */
  }

  const role = (await client.guilds_db.get(
    guild.id,
    "verified_role"
  )) as string;

  if (!role) return VerificationStatus.INVALID_SETUP;

  try {
    if (!(member instanceof GuildMember))
      member = await guild.members.fetch(member.user.id);
    await member.roles.add(role);
    await member.setNickname(name as string);
    return VerificationStatus.SUCCESSFUL;
  } catch (e) {
    throw e;
  }
}
