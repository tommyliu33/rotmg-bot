import { inlineCode } from "@discordjs/builders";
import { getGuildSetting, getPlayer, SettingsKey, verify } from "@functions";
import { verification_private_profile } from "@util";
import { stripIndents } from "common-tags";
import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { nanoid } from "nanoid";

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

    const player = await getPlayer(ign);
    if ("error" in player) {
      await interaction.editReply({
        embeds: [verification_private_profile()],
      });
      return;
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

    void interaction.editReply({
      content: `You have been successfully verified in ${inlineCode(
        interaction.guild!.name
      )}!`,
    });
    await verify(interaction.guildId, interaction.user.id, ign);
  }
}
