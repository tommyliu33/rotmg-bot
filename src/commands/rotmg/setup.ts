import { Command, command, CommandContext } from "@lib";
import { setupVerificationEmbed } from "@verification";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

@command({
  name: "setup",
  description: "Setup the server.",
  options: [
    {
      name: "verification_channel",
      description: "The channel used for verification.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "embed",
          description: "Creates and sends the verification channel embed",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    const { options } = ctx.interaction;

    await ctx.interaction.deferReply();

    if (options.getSubcommand(false)) {
      const channel = (await ctx.client.guilds_db.get(
        ctx.guild?.id!,
        "verification_channel"
      )) as string;

      await setupVerificationEmbed(ctx.guild!, channel);
      return await ctx.interaction.editReply("Done.");
    }

    return await ctx.interaction.editReply("hello world.");
  }
}
