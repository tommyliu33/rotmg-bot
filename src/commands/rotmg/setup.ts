import { Command, command, CommandContext } from "@lib";

@command({
  name: "setup",
  description: "setup the server for stuffs. such as verification embeds",
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    await ctx.reply("setup stuffs.");
  }
}
