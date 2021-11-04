import { SlashCommandBuilder } from "@discordjs/builders";

export const ConfigCommand = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure bot settings for the current server")
  .addSubcommand((input) =>
    input
      .setName("verified_role")
      .setDescription("role for a user when verified")
      .addRoleOption((input) =>
        input.setName("role").setDescription("role to use").setRequired(true)
      )
  )

  .toJSON();
