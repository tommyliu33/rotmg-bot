import { inlineCode } from "@discordjs/builders";
import {
  getGuildSetting,
  getLogChannel,
  getPlayer,
  SettingsKey,
  verify,
} from "@functions";
import { verification_private_profile, verification_successful } from "@util";
import { stripIndents } from "common-tags";
import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

// TODO: implement verification methods
// addalt command
// cleanup folder structure for verification
// @utils -> set default user entry / guild entry when needed

@Discord()
export abstract class VerifyCommand {
  @Slash("verify")
  private async execute(
    @SlashOption("ign", {
      required: true,
      type: "STRING",
      description: "Name to verify under",
    })
    ign: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const logChannel = await getLogChannel(interaction.guildId);

    const player = await getPlayer(ign);
    if ("error" in player) {
      return await interaction.reply({
        embeds: [verification_private_profile()],
        ephemeral: true,
      });
    }

    const roleId = await getGuildSetting(
      interaction.guildId,
      SettingsKey.MainUserRole
    );
    const role = await interaction.guild?.roles.fetch(roleId);

    if (!role) {
      void interaction.editReply({
        content: stripIndents`
        An error occured while trying to fetch the role.
        If the issue persists, contact the server staff for additional support.`,
      });
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (
      !member?.manageable ||
      !interaction.guild?.me?.permissions.has("MANAGE_ROLES")
    ) {
      void interaction.editReply({
        content: stripIndents`
        I am unable to add the verified role for you.
        If the issue persists, contact the server staff for additional support.`,
      });
    }

    if (logChannel) {
      await logChannel?.send({
        embeds: [verification_successful(member!, ign)],
      });
    }

    void interaction.editReply({
      content: `You have been successfully verified in ${inlineCode(
        interaction.guild!.name
      )}!`,
    });
    await verify(interaction.guildId, interaction.user.id, ign);
  }
}
