import { bold, inlineCode } from "@discordjs/builders";
import { Command, command, CommandContext, MessageChannel } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { Message, MessageEmbed } from "discord.js";
import { dungeons } from "../../../dungeons";

@command({
  name: "headcount",
  description: "headcount for a raid.",
  options: dungeons.map((d) => ({
    name: d.name,
    description: d["full-name"],
    type: ApplicationCommandOptionType.Subcommand,
  })),
})
export default class extends Command {
  public async exec(ctx: CommandContext) {
    await ctx.interaction.deferReply();

    const { interaction, guild, client } = ctx;
    const name = ctx.interaction.options.getSubcommand();

    const dungeon = dungeons.find((c) => c.name === name)!;
    const { thumbnail, color, portal, reacts, keys } = dungeon!;

    const description = [
      `React with ${portal} to participate.`,
      `React with ${keys
        .map((k) => k.emote)
        .join("")} if you are willing to pop ${
        keys.length === 4
          ? "runes/inc"
          : keys.length === 2
          ? "a key/vial"
          : "a key"
      } for the raid.`,
      reacts[0].name === "rusher"
        ? `\nReact with ${reacts[0].emote} if you plan on rushing`
        : "",
      `React below to indiciate the ${bold("classes/gear")} that you're ${bold(
        "bringing"
      )}.`,
    ].join("\n");

    const id = String(
      await client.guilds_db.get(guild?.id!, "afk_check_channel")
    );
    const channel = (await guild?.channels.fetch(id)) as MessageChannel;

    const msg = (await channel.send({
      content: `@here ${inlineCode(dungeon.name)}`,
      embeds: [
        new MessageEmbed()
          .setTitle(inlineCode(dungeon["full-name"]))
          .setDescription(description)
          .setThumbnail(thumbnail)
          .setFooter(ctx.user.tag, ctx.user.displayAvatarURL({ dynamic: true }))
          .setColor(color!)
          .setTimestamp(),
      ],
    })) as Message;
    await interaction.deleteReply();

    await Promise.all(
      [portal, ...keys, ...reacts].map(
        async (r) => await msg.react(typeof r === "string" ? r : r.emote)
      )
    );
  }
}
