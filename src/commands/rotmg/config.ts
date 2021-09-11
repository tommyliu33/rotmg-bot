import { Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

@command({
  name: "config",
  description: "edit server configuration. provide no options to view setup.",
  options: [
    {
      name: "verification_method",
      description: "method user goes through to verify",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "button",
          description: "user clicks the button to start verification",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: "manual",
          description: "user runs /verify command to start verification",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: "verified_role",
      description: "role to add when user is verified",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "role",
          description: "the verified role",
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
    {
      name: "verification_channel",
      description: "channel for users to start verification.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "channel to set",
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
      ],
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext): Promise<void> {
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
    }
  }
}
