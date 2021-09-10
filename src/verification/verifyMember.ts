import { Bot, command, MessageChannel } from "@lib";
import type { APIInteractionGuildMember } from "discord-api-types/v9";
import {
  CommandInteraction,
  Guild,
  GuildMember,
  MessageActionRow,
  MessageComponentInteraction,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js";

export enum VerificationStatus {
  // bad
  FAILED = 0,
  INVALID_SETUP = -1,
  MEMBERSHIP_SCREENING = -2,

  // good
  SUCCESSFUL = 1,
  ALREADY_VERIFIED = 2,

  IN_PROGRESS = 3,
}

export async function verifyMember(
  member: APIInteractionGuildMember | GuildMember,
  channel: MessageChannel,
  guild: Guild,
  name?: string,
  commandInteraction?: CommandInteraction
): Promise<VerificationStatus> {
  const client = guild.client as Bot;

  const users = await client.users_db.all();
  const target = users.find((c) => c.ID === member.user.id);

  const role = (await client.guilds_db.get(
    guild.id,
    "verified_role"
  )) as string;
  return new Promise(async (resolve, reject) => {
    if (!role) return reject(VerificationStatus.INVALID_SETUP);

    if (!(member instanceof GuildMember))
      member = await guild.members.fetch(member.user.id);
    if (member.pending) return reject(VerificationStatus.MEMBERSHIP_SCREENING);

    if (name) {
      if (users.find((c) => c.data.names.includes(name))) {
        return reject(VerificationStatus.ALREADY_VERIFIED);
      } else {
        if (target) {
          await client.users_db.push(member.user.id, name, "names");
        } else {
          await client.users_db.set(member.user.id, { names: [] });
          await client.users_db.push(member.user.id, name, "names");
        }
      }
    } else {
      const names: string[] | undefined = target?.data?.names;

      if (names) {
        const menu = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select-ign-to-verify")
            .addOptions(names.map((c) => ({ label: c, value: c })))
        );

        const msg = await channel.send({
          embeds: [
            new MessageEmbed()
              .setDescription(
                ["Select a name to verify under.", "You have 1 minute."].join(
                  "\n\n"
                )
              )
              .setColor("BLUE"),
          ],
          components: [menu],
        });

        const filter = (i: MessageComponentInteraction) => {
          i.deferUpdate();
          return i.user.id === member.user.id;
        };

        const interaction = await msg
          .awaitMessageComponent({
            filter,
            componentType: "SELECT_MENU",
            time: 15000,
          })
          .catch(() => {});

        if (!interaction) {
          await msg.delete();
          await commandInteraction?.editReply("Time ran out.");
        } else {
          const { values, customId } = interaction as SelectMenuInteraction;
          if (customId !== "select-ign-to-verify") return;

          const name = values[0];
          resolve(await finish(member as GuildMember, role, name));

          await msg.delete();
          return;
        }
      }
    }
  });
}

async function finish(
  member: GuildMember,
  role: string,
  name: string
): Promise<VerificationStatus> {
  return new Promise(async (resolve, reject) => {
    try {
      await member.roles.add(role);
      await member.setNickname(name);
      resolve(VerificationStatus.SUCCESSFUL);
    } catch (e) {
      reject(VerificationStatus.FAILED);
    }
  });
}
