import { Command, command, CommandContext } from "@lib";

@command({
  name: "ping",
  description: "Useful to see if the bot works.",
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    return await ctx.reply("pong.");
  }
}
