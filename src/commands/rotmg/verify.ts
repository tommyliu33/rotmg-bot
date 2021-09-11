import { Command, command, CommandContext } from "@lib";
import { verifyMember } from "@verification";
import { APIMessage, ApplicationCommandOptionType } from "discord-api-types/v9";
import type { Message } from "discord.js";

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
  public async exec(ctx: CommandContext): Promise<Message | APIMessage> {
    await ctx.interaction.deferReply({ ephemeral: true });

    const status = await verifyMember(ctx).catch(() => {});
    console.log("status", status);

    let msg: string = "";
    switch (status) {
      case -1:
        msg = "The server's setup is invalid.";
        break;
      case 0:
        msg = "An error occured while trying to verify you.";
        break;
      case -2:
        msg =
          "You must complete the server's membership screening before starting verification.";
        break;
      case -3:
        msg =
          "Could not find RealmEye profile, the account is privated or does not exist.";
        break;
      case 1:
        msg = "You have been successfully verified!";
        break;
      case 2:
        msg = "You are already verified.";
        break;
      case 4:
        msg = "Just added your role, you are already logged!";
        break;
    }

    return await ctx.interaction.editReply({ content: msg });
  }
}
