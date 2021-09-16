import { Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

@command({
  name: "config",
  description: "Edit/view the server configuration.",
  options: [
    {
      name: "verification_method",
      description: "The method a user goes through to verify.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "button",
          description: "User presses the button to start verification",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: "manual",
          description:
            "User must manually run /verify to start verification in the verification channel",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: "verified_role",
      description: "The role to add when a user is verified.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "role",
          description: "The role to add",
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
    {
      name: "verification_channel",
      description: "The channel for users to start verification.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "The channel to set",
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
      ],
    },
    {
      name: "afk_check_channel",
      description: "The channel for afk checks.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "The channel to set",
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
      ],
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    const { client } = ctx;

    const subcommand = ctx.interaction.options.getSubcommand();
    switch (subcommand) {
      case "button":
      case "manual":
        await client.guilds_db.set(
          ctx.guild?.id!,
          subcommand,
          "verification_method"
        );
        return await ctx.reply(
          `Setting \`verificationMethod\` to **${subcommand}**.`
        );
      case "verified_role":
        const verifiedRole = ctx.interaction.options.getRole("role");

        if (ctx.guild?.roles.everyone.id === verifiedRole?.id) {
          return await ctx.reply(
            "Cannot set the `@everyone` role as the 'verified raider' role."
          );
        }

        await ctx.reply(
          `Setting \`${verifiedRole?.name}\` as the "Verified Raider" role.`
        );

        await client.guilds_db.set(
          ctx.guild?.id!,
          verifiedRole?.id,
          "verified_role"
        );
        return;
      case "verification_channel":
        const verificationChannel =
          ctx.interaction.options.getChannel("channel");
        if (verificationChannel?.type !== "GUILD_TEXT")
          return await ctx.reply(
            "Verification channel can only be a text channel."
          );

        await client.guilds_db.set(
          ctx.guild?.id!,
          verificationChannel.id,
          "verification_channel"
        );

        return await ctx.reply(
          `Setting ${verificationChannel.toString()} as the "Verification Channel".`
        );
      case "afk_check_channel":
        const afkCheckChannel = ctx.interaction.options.getChannel("channel");
        if (afkCheckChannel?.type !== "GUILD_TEXT")
          return await ctx.reply(
            "AFK check channel can only be a text channel."
          );

        await client.guilds_db.set(
          ctx.guild?.id!,
          afkCheckChannel.id,
          "afk_check_channel"
        );

        return await ctx.reply(
          `Setting ${afkCheckChannel.toString()} as the "afk-check" channel.`
        );

        break;
    }
  }
}
