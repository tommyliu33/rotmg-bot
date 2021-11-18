import {
  CaseAction,
  createCase
} from "@functions";
import { InGuild, ModRole } from "@guards";
import { CommandInteraction, Formatters, GuildMember, User } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { nanoid } from "nanoid";

@Discord()
export class BanCommand {
  @Guard(InGuild(), ModRole())
  @Slash("ban", { description: "Ban a user from the server." })
  private async ban(
    @SlashOption("user", {
      required: true,
      type: "USER",
      description: "User to ban",
    })
    @SlashOption("days", {
      required: false,
      type: "NUMBER",
      description: "Number of days of messages to delete (0-7, inclusive)",
    })
    @SlashOption("reason", {
      required: false,
      type: "STRING",
      description: "Reason for the ban",
    })
    user: User,
    // TODO: add min/max values for days when possible
    days: number | undefined,
    reason: string | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    if (days && (days < 0 || days > 10)) {
      return interaction.reply({
        content: "Days must be between 0-9, inclusive.",
        ephemeral: true,
      });
    }

    const bans = await interaction.guild?.bans.fetch().catch(() => {});
    const ban = bans?.has(user.id) ? bans?.get(user.id) : null;

    if (ban) {
      return interaction.reply({
        content: `${ban.user.tag} (${user.id}) is already banned.`,
        ephemeral: true,
      });
    }

    if (
      user.id === interaction.user.id ||
      user.id === interaction.client.user?.id
    ) {
      return interaction.reply({
        content: "Cannot do that.",
        ephemeral: true,
      });
    }

    let member: GuildMember | undefined;
    await interaction.guild?.members.fetch();

    if (interaction.guild?.members.cache.has(user.id)) {
      member = interaction.guild.members.cache.get(user.id);
      if (!member?.bannable) {
        return interaction.reply({
          content: "I cannot ban this user.",
          ephemeral: true,
        });
      }

      const authorMember = await interaction.guild?.members.fetch({
        user: interaction.user.id,
      })!;

      if (!this.canManage(authorMember, member!)) {
        return interaction.reply({
          content: "You cannot ban this user.",
          ephemeral: true,
        });
      }
    }

    await interaction.guild?.bans.create(user, {
      days,
      reason,
    });

    const payload = {
      id: nanoid(),
      action: CaseAction.BAN,

      reason,

      message_id: "",

      moderator_id: interaction.user.id,
      moderator_tag: interaction.user.tag,

      target_id: user.id,
      target_tag: user.tag,
    };
    await createCase(interaction.guildId, payload);

    await interaction.reply(
      `${Formatters.bold("Banned")} ${user.tag ?? member?.user.tag} (${
        user.id
      }).`
    );
  }

  private canManage(a: GuildMember, b: GuildMember): boolean {
    if (a.id === b.id) return false;
    if (a.id === a.guild.me?.id) return false;
    if (b.id === a.guild.me?.id) return false;

    if (!a.guild.me) a.guild.members.fetch(a.client?.user?.id!).catch(() => {});

    if (a.id === a.guild.ownerId) return true;
    if (b.id === b.guild.ownerId) return true;
    if (b.guild.ownerId === b.guild.me?.id) return true;

    return a.roles.highest.comparePositionTo(b.roles.highest) > 0;
  }
}
