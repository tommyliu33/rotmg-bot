import { Command, command, CommandContext } from "@lib";
import { MessageEmbed } from "discord.js";
import { stripIndents } from "common-tags";

@command({
  name: "stats",
  description: "Displays bot information.",
})
export default class extends Command {
  public async exec(ctx: CommandContext): Promise<void> {
    const { client } = ctx;
    const embed = new MessageEmbed()
      .setColor("AQUA")
      .setDescription(
        stripIndents`
				**${client.guilds.cache.size}** servers, **${client.users.cache.size}** users

				Node ${process.version}
				Heap used ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
			`
      )
      .setAuthor(client.user?.tag!, client.user?.avatarURL()!);
    await ctx.reply({ embeds: [embed] });
  }
}
