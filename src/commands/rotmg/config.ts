import { Bot, Command, command, CommandContext, Verification } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { MessageEmbed } from "discord.js";

@command({
  name: "config",
  description: "edit server configuration. provide no options to view setup.",
  options: [
    {
      name: "verified_role",
      description: "role to add when user is verified",
      type: ApplicationCommandOptionType.Role,
      required: false,
    },
    {
      name: "verification_channel",
      description: "channel for users to start verification.",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    const client = ctx.client as Bot;

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

      await client.verification.setup_embed(verification_channel.id);
    }
  }
}
