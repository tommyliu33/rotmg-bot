import { Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

@command({
  name: "config",
  description: "edit server configuration. provide no options to view setup.",
  options: [
    {
      name: "verification_method",
      description: "method user goes through to verify",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "button",
          description: "user clicks the button to start verification",
          type: ApplicationCommandOptionType.Boolean,
        },
        {
          name: "manual",
          description: "user runs /verify command to start verification",
          type: ApplicationCommandOptionType.Boolean,
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
          description: "verified role",
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
  public async exec(ctx: CommandContext) {
    const { client } = ctx;

    // TODO: fix options
    const verified_role = ctx.interaction.options.getRole("verified_role");
    const verification_channel = ctx.interaction.options.getChannel(
      "verification_channel"
    );

    if (verified_role) {
      const verified_role = ctx.interaction.options.getRole("verified_role");

      await ctx.reply(
        `Setting \`${verified_role?.name}\` as the "Verified Raider" role.`
      );

      await client.guilds_db.set(
        ctx.guild?.id!,
        verified_role?.id,
        "verified_role"
      );
    }

    if (verification_channel) {
      if (verification_channel?.type !== "GUILD_TEXT")
        return await ctx.reply(
          "Verification channel can only be a text channel."
        );

      await client.guilds_db.set(
        ctx.guild?.id!,
        verification_channel.id,
        "verification_channel"
      );

      await ctx.reply(
        `Setting ${verification_channel.toString()} as the "Verification Channel".`
      );
    }
  }
}
