import {
  CaseAction,
  createCase,
  getGuildSetting,
  getModLogChannel,
  sendModLog,
  SettingsKey,
} from "@functions";
import { InGuild, ModRole } from "@guards";
import { CommandInteraction, Formatters, GuildMember, User } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { nanoid } from "nanoid";

@Discord()
export class BanCommand {
  @Guard(InGuild(), ModRole())
  @Slash("unban", { description: "Unban a user from the server." })
  private async ban(
    @SlashOption("user", {
      required: true,
      type: "USER",
      description: "User to unban",
    })
    @SlashOption("reason", {
      required: false,
      type: "STRING",
      description: "Reason for the unban",
    })
    user: User,
    reason: string | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    user = await interaction.client.users.fetch(user);

    try {
      const bans = await interaction.guild?.bans.fetch().catch(() => {});
      const ban = bans?.has(user.id) ? bans?.get(user.id) : null;
      if (!ban) {
        return interaction.reply({
          content: `${user.tag} (${user.id}) is not banned.`,
          ephemeral: true,
        });
      }
    } catch {}

    await interaction.guild?.bans.remove(user, reason);

    const payload = {
      id: nanoid(),
      action: CaseAction.UNBAN,

      reason,

      message_id: "",

      moderator_id: interaction.user.id,
      moderator_tag: interaction.user.tag,

      target_id: user.id,
      target_tag: user.tag,
    };

    const logChannel = await getModLogChannel(
      interaction.guild!,
      await getGuildSetting(interaction.guildId, SettingsKey.ModLogChannel)
    );
    const msgId = await sendModLog(logChannel!, payload);

    await createCase(interaction.guildId, { ...payload, message_id: msgId });
    await interaction.reply(
      `${Formatters.bold("Unbanned")} ${user.tag} (${user.id}).`
    );
  }
}
