import { Command, command, CommandContext } from "@lib";
import { MessageEmbed } from "discord.js";

function uptime(): string {
  const u = process.uptime();

  const d = Math.floor(u / 86400);
  const hrs = Math.floor((u % 86400) / 3600);
  const min = Math.floor(((u % 86400) % 3600) / 60);
  const sec = Math.floor(((u % 86400) % 3600) % 60);

  if (d === 0 && hrs !== 0) {
    return `${hrs} Hour(s), ${min} Minute(s) & ${sec} Second(s)`;
  } else if (d === 0 && hrs === 0 && min !== 0) {
    return `${min} Minute(s) & ${sec} Second(s)`;
  } else if (d === 0 && hrs === 0 && min === 0) {
    return `${sec} Second(s)`;
  } else {
    return `${d} Day, ${hrs} Hour(s), ${min} Minute(s) & ${sec} Second(s)`;
  }
}

@command({
  name: "stats",
  description: "Displays bot information.",
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    const { client } = ctx;

    return await ctx.reply({
      embeds: [
        new MessageEmbed()
          .setAuthor(client.user?.tag!, client.user?.displayAvatarURL())
          .setDescription(
            [
              `**${client.guilds.cache.size}** servers **${client.users.cache.size}** users`,
              "",
              `Node.js **${process.version}**`,
              `Heap used **${(
                process.memoryUsage().heapUsed /
                1024 /
                1024
              ).toFixed(2)}MB**`,
              "",
              `Up for ${uptime()}`,
            ].join("\n")
          ),
      ],
    });
  }
}
