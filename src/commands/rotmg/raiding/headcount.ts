import { Command, command, CommandContext } from "@lib";
import { APIMessage, ApplicationCommandOptionType } from "discord-api-types/v9";
import { Message, MessageEmbed } from "discord.js";
import { dungeons } from "../../../dungeons";

console.log(
  "dungeons",
  dungeons.map((c) => ({
    name: c["name"],
    description: c["full-name"],
    type: ApplicationCommandOptionType.Subcommand,
  }))
);

@command({
  name: "headcount",
  description: "headcount for a raid.",
  options: dungeons.map((c) => ({
    name: c["name"],
    description: c["full-name"],
    type: ApplicationCommandOptionType.Subcommand,
  })),
})
export default class extends Command {
  public async exec(
    ctx: CommandContext
  ): Promise<Message | APIMessage | undefined> {
    await ctx.interaction.deferReply();
    const subcommand = ctx.interaction.options.getSubcommand();

    const dungeon = dungeons.find((c) => c.name === subcommand);
    if (!dungeon)
      return await ctx.interaction.editReply("dungeon data not found.");

    const { thumbnail, color, reacts } = dungeon;

    const multipleKeys = reacts[1].emote.includes("|");

    const description: string[] = [
      `React ${reacts[0].emote} to participate.`,
      `React ${
        multipleKeys
          ? reacts[1].emote.split("|").join("") // multiple keys
          : reacts[1].emote // default
      } if you are willing to pop ${
        reacts[1].emote.split("|").length === 2
          ? "a key & vial"
          : reacts[1].emote.split("|").length === 3
          ? "runes"
          : "a key"
      } for the raid.`,
      "",
      // TODO: add gear emotes
      `React with gear choices below:`,
    ];

    const { tag, id } = ctx.user;
    const { nickname } = await ctx.guild?.members.fetch(id)!;

    const embed = new MessageEmbed()
      .setTimestamp()
      .setColor(color ?? 0)
      .setThumbnail(thumbnail)
      .setFooter(nickname ?? tag)
      .setTitle(`\`${dungeon["full-name"]}\``)
      .setDescription(description.join("\n"));

    let msg = (await ctx.interaction.editReply({
      content: `@here \`${dungeon["full-name"]}\` headcount started by <@${id}>`,
      embeds: [embed],
    })) as Message;

    // handle reactions
    await Promise.all(
      reacts.map(async (c) => {
        if (c.emote.includes("|"))
          c.emote.split("|").forEach(async (e) => await msg.react(e));
        else await msg.react(c.emote);
      })
    );

    return;
  }
}
