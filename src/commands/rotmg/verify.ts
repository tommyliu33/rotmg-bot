import { Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { verifyMember, VerificationStatus } from "@verification";
import { Guild, GuildMember } from "discord.js";

@command({
  name: "verify",
  description: "verify your ingame name.",
  options: [
    {
      name: "name",
      description: "name to verify under",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    const name = ctx.interaction.options.getString("name");
    const verified = await verifyMember(
      ctx.interaction.member as GuildMember,
      ctx.interaction.guild as Guild,
      name as string
    );

    let msg = "";
    switch (verified) {
      case -1:
        msg = "The server's setup is invalid.";
        break;
      case 0:
        msg = "An error occured while trying to verify you.";
        break;
      case 1:
        msg = "You have been successfully verified!";
        break;
      case 2:
        msg = "You are already verified";
        break;
    }

    await ctx.reply({ content: msg, ephemeral: true });
  }
}
