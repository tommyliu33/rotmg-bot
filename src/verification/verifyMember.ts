import { Bot } from "@lib";
import type { APIInteractionGuildMember } from "discord-api-types/v9";
import { Guild, GuildMember } from "discord.js";

/**
 * verify a raider
 * @param member member to verify
 * @param name if the name is not given -> assume they have only one saved name and use that
 */
export async function verifyMember(
  member: APIInteractionGuildMember | GuildMember,
  guild: Guild,
  name?: string
) {
  const client = guild.client as Bot;

  const role = (await client.guilds_db.get(
    guild.id,
    "verified_role"
  )) as string;

  if (!(member instanceof GuildMember))
    member = await guild.members.fetch(member.user.id);

  if (member.roles.cache.has(role)) {
    await member.setNickname(`${member.nickname} | ${name}`);
    return true;
  }

  await member.roles.add(role);

  return true;
}
