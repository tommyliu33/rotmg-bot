import { Command, command, CommandContext } from "@lib";
import { setupVerificationEmbed } from "@verification";
import { APIMessage, ApplicationCommandOptionType } from "discord-api-types/v9";
import type { Message } from "discord.js";

@command({
  name: "setup",
  description: "setup the server for stuffs. such as verification embeds",
  options: [
    {
      name: "verification_channel",
      description: "abc",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "embed",
          description: "spawn the verification channel embed",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext): Promise<Message | APIMessage> {
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
