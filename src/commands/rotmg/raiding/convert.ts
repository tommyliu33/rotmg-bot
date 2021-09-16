import { Command, command, CommandContext, MessageChannel } from "@lib";

@command({
  name: "convert",
  description: "Converts a headcount to an AFK check.",
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    await ctx.interaction.deferReply();
    const { guild, client } = ctx;

    const id = String(
      await client.guilds_db.get(guild?.id!, "afk_check_channel")
    );
    const channel = (await guild?.channels.fetch(id)) as MessageChannel;

    if (!channel)
      await ctx.interaction.editReply("Could not find afk check channel.");

    const messages = await channel.messages.fetch();
    const msg = messages
      .filter(
        (c) =>
          c.author.id === ctx.client?.user?.id &&
          c.embeds[0]?.footer?.text === ctx.user.tag &&
          Date.now() - c.createdTimestamp <= 900000 // this should be 15min
      )
      ?.first();

    if (msg) {
      await msg.edit({
        content: `${msg.content} afk-check has started`,
        embeds: [
          msg.embeds[0].setFooter(
            ctx.user.tag,
            ctx.user.displayAvatarURL({ dynamic: true })
          ),
        ],
      });
      console.log("converted");
    }

    await ctx.interaction.deleteReply();
  }
}
