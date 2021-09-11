import { Command, command, CommandContext } from "@lib";

@command({
  name: "ping",
  description: "pong.",
})
export default class extends Command {
  public async exec(ctx: CommandContext): Promise<void> {
    return await ctx.reply("pong.");
  }
}
