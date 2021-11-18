import {
  CaseAction,
  createCase
} from "@functions";
import { InGuild, ModRole } from "@guards";
import { CommandInteraction, Formatters, User } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { nanoid } from "nanoid";

@Discord()
export class BanCommand {
  @Guard(InGuild(), ModRole())
  @Slash("warn", { description: "Assigns a warning to a user." })
  private async ban(
    @SlashOption("user", {
      required: true,
      type: "USER",
      description: "User to warn",
    })
    @SlashOption("reason", {
      required: true,
      type: "STRING",
      description: "Reason for the warn",
    })
    user: User,
    reason: string,
    interaction: CommandInteraction
  ): Promise<void> {
    user = await interaction.client.users.fetch(user.id);

    await interaction.guild?.members.fetch();
    if (!interaction.guild?.members.cache.has(user.id)) {
      return interaction.reply({
        content: `${user.tag} (${user.id}) is not in the server.`,
        ephemeral: true,
      });
    }

    const payload = {
      id: nanoid(),
      action: CaseAction.WARN,

      reason,

      message_id: "",

      moderator_id: interaction.user.id,
      moderator_tag: interaction.user.tag,

      target_id: user.id,
      target_tag: user.tag,
    };

    await createCase(interaction.guildId, payload);
    await interaction.reply(
      `${Formatters.bold("Warning added")} for ${user.username}#${
        user.discriminator
      } (${user.id}).`
    );

    try {
      await user.send({
        content: `You were warned in ${Formatters.bold(
          interaction.guild?.name!
        )} (${Formatters.inlineCode(
          interaction.guildId
        )}) for:\n${Formatters.codeBlock(reason)}`,
      });
    } catch {
      await interaction.followUp({
        content: `Unable to send warning information to ${user.tag}.`,
        ephemeral: true,
      });
    }
  }
}
