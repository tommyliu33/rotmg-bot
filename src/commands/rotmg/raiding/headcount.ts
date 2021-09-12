import { Command, command, CommandContext } from "@lib";
import { oneLine, stripIndents } from "common-tags";
import { APIMessage, ApplicationCommandOptionType } from "discord-api-types/v9";
import {
  Message,
  MessageActionRow,
  MessageComponentInteraction,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js";
import { dungeons } from "../../../dungeons";
import { bold, inlineCode, memberNicknameMention } from "@discordjs/builders";

@command({
  name: "headcount",
  description: "headcount for a raid.",
  options: [
    {
      name: "dungeon",
      description: "Full/abbreviated name of the dungeon",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "channel",
      description: "The voice channel to use for the raid",
      type: ApplicationCommandOptionType.Channel,
    },
  ],
})
export default class extends Command {
  public async exec(
    ctx: CommandContext
  ): Promise<Message | APIMessage | undefined> {
    await ctx.interaction.deferReply({ ephemeral: true });

    let dungeonName = ctx.interaction.options.getString("dungeon");
    let voiceChannel = ctx.interaction.options.getChannel("vc");

    const { guild } = ctx.interaction;
    const channels = await guild?.channels.fetch().catch(() => {});
    const voiceChannels = channels?.filter((c) => c.type === "GUILD_VOICE");

    const embed = new MessageEmbed().setColor(0x2e8b49);
    if (!voiceChannel) {
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu().setCustomId("select-voice-channel").addOptions(
          voiceChannels!.map((c) => ({
            label: c.name,
            value: c.name,
          }))
        )
      );

      const msg = (await ctx.interaction.editReply({
        embeds: [
          embed.setDescription(stripIndents`
        Select a voice channel for the raid.
        You have 1 minute.`),
        ],
        components: [row],
      })) as Message;

      const filter = (i: MessageComponentInteraction) => {
        i.deferUpdate();
        return (
          i.customId === "select-voice-channel" && i.user.id === ctx.user.id
        );
      };

      const interaction = await msg
        .awaitMessageComponent({
          filter,
          componentType: "SELECT_MENU",
          time: 60000,
        })
        .catch(() => {});

      if (!interaction)
        return await ctx.interaction.editReply(
          "Failed to select voice channel in time, cancelling."
        );
      else {
        const { values } = interaction as SelectMenuInteraction;
        voiceChannel = channels?.find((c) => c.name === values[0])!;

        if (voiceChannel.type !== "GUILD_VOICE")
          return await ctx.interaction.editReply(
            "The targetted channel must be a voice channel."
          );
      }
    } else {
      if (voiceChannel?.type !== "GUILD_VOICE")
        return await ctx.interaction.editReply(
          "The targetted channel must be a voice channel."
        );
    }

    let dungeon = dungeons.find((c) => c.name === dungeonName);
    if (!dungeon) {
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu().setCustomId("select-dungeon").addOptions(
          dungeons.map((c) => ({
            label: c["full-name"],
            value: c.name,
          }))
        )
      );

      const msg = (await ctx.interaction.editReply({
        embeds: [
          embed.setDescription(stripIndents`
          Select the dungeon for the raid.
          You have 1 minute.`),
        ],
        components: [row],
      })) as Message;

      const filter = (i: MessageComponentInteraction) => {
        i.deferUpdate();
        return i.customId === "select-dungeon" && i.user.id === ctx.user.id;
      };

      const interaction = await msg
        .awaitMessageComponent({
          filter,
          componentType: "SELECT_MENU",
          time: 60000,
        })
        .catch(() => {});

      if (!interaction) {
        return await ctx.interaction.editReply(
          "Failed to select dungeon in time, cancelling."
        );
      } else {
        const { values } = interaction as SelectMenuInteraction;

        dungeonName = values[0];
        dungeon = dungeons.find((c) => c.name === dungeonName);
      }
    }

    if (dungeon && voiceChannel && voiceChannel.type === "GUILD_VOICE") {
      const { thumbnail, color, reacts } = dungeon!;

      const description = [
        `React with ${reacts[0].emote} to participate.`,
        `React with ${
          reacts[1].emote.includes("|")
            ? reacts[1].emote.split("|").join("")
            : reacts[1].emote
        } if you are willing to pop ${
          reacts[1].emote.split("|").length === 2
            ? "a key/vial"
            : reacts[1].emote.split("|").length === 4
            ? "runes/inc"
            : "a key"
        } for the raid.`,
        reacts[2].name === "rusher"
          ? `\nReact with ${reacts[2].emote} if you plan on rushing`
          : "",
        `React below to indiciate the ${bold(
          "classes/gear"
        )} that you're ${bold("bringing")}\n${reacts
          .slice(reacts[2].name === "rusher" ? 3 : 2)
          .map((e) => e.emote)
          .join(" ")}`,
      ].join("\n");

      embed
        .setTitle(inlineCode(dungeon["full-name"]))
        .setDescription(description)
        .setThumbnail(thumbnail)
        .setTimestamp()
        .setColor(color!);

      const msg = await ctx.channel.send({
        content: oneLine`@here ${inlineCode(dungeon["full-name"])}
          headcount started by ${memberNicknameMention(ctx.user.id)} for ${
          voiceChannel?.name
        }`,
        embeds: [embed],
      });

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
}
