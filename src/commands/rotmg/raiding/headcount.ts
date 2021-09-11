import { Command, command, CommandContext } from "@lib";
import { oneLine } from "common-tags";
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

@command({
  name: "headcount",
  description: "headcount for a raid.",
  options: [
    {
      name: "dungeon",
      description: "abv. for dungeon name (or full)",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "vc",
      description: "voice channel for the raid",
      type: ApplicationCommandOptionType.Channel,
    },
  ],
})
export default class extends Command {
  public async exec(
    ctx: CommandContext
  ): Promise<Message | APIMessage | undefined> {
    await ctx.interaction.deferReply(/*{ ephemeral: true }*/);

    let dungeonName = ctx.interaction.options.getString("dungeon");
    let voiceChannel = ctx.interaction.options.getChannel("vc");

    const { guild } = ctx.interaction;
    const channels = await guild?.channels.fetch().catch(() => {});
    const voiceChannels = channels?.filter((c) => c.type === "GUILD_VOICE");

    if (!voiceChannel) {
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu().setCustomId("select-voice-channel").addOptions(
          voiceChannels!.map((c) => ({
            label: c.name,
            value: c.name,
          }))
        )
      );

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setDescription(
          "Select a voice channel for the raid.\nYou have 1 minute."
        );

      const msg = (await ctx.interaction.editReply({
        embeds: [embed],
        components: [row],
      })) as Message;

      const filter = (i: MessageComponentInteraction) => {
        i.deferUpdate();
        return i.user.id === ctx.user.id;
      };

      const interaction = await msg
        .awaitMessageComponent({
          filter,
          componentType: "SELECT_MENU",
          time: 60000,
        })
        .catch(() => {});

      if (!interaction) {
        await ctx.interaction.editReply("failed to select vc, aborting.");
      } else {
        const { values, customId } = interaction as SelectMenuInteraction;
        if (customId !== "select-voice-channel") return;

        voiceChannel = channels?.find((c) => c.name === values[0])!;
        console.log("done with channel selection");
      }
    } else {
      if (voiceChannel?.type !== "GUILD_VOICE")
        return await ctx.interaction.editReply(
          "vc channel should actually be a vc."
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

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setDescription("Select the dungeon the raid.\nYou have 1 minute.");

      const msg = (await ctx.interaction.editReply({
        embeds: [embed],
        components: [row],
      })) as Message;

      const filter = (i: MessageComponentInteraction) => {
        i.deferUpdate();
        return i.user.id === ctx.user.id;
      };

      const interaction = await msg
        .awaitMessageComponent({
          filter,
          componentType: "SELECT_MENU",
          time: 60000,
        })
        .catch(() => {});

      if (!interaction) {
        await ctx.interaction.editReply("failed to select dungeon, aborting.");
      } else {
        const { values, customId } = interaction as SelectMenuInteraction;
        if (customId !== "select-dungeon") return;

        dungeonName = values[0];
        dungeon = dungeons.find((c) => c.name === dungeonName);

        console.log("done with dungeon selection");
      }
    }

    if (dungeon && voiceChannel && voiceChannel.type === "GUILD_VOICE") {
      console.log("here.");
      const { thumbnail, color, reacts } = dungeon!;

      const multipleKeys = reacts[1].emote.includes("|");

      const description: string[] = [
        `React with ${reacts[0].emote} to participate.`,
        `React with ${
          multipleKeys
            ? reacts[1].emote.split("|").join("") // multiple keys
            : reacts[1].emote // default
        } if you are willing to pop ${
          reacts[1].emote.split("|").length === 2
            ? "a key & vial"
            : reacts[1].emote.split("|").length === 4
            ? "runes/inc"
            : "a key"
        } for the raid.`,
        "",
        `React below to indiciate **classes/gear** that you're **bringing**:
      ${reacts
        .slice(2)
        .map((e) => e.emote)
        .join(" ")}`,
      ];

      const embed = new MessageEmbed()
        .setTimestamp()
        .setColor(color ?? 0)
        .setThumbnail(thumbnail)
        .setTitle(`\`${dungeon["full-name"]}\``)
        .setDescription(description.join("\n"));

      let msg = (await ctx.interaction.followUp({
        content: oneLine`@here ${reacts[0].emote} \`${dungeon["full-name"]}\`
          headcount started by <@${ctx.user.id}> for ${voiceChannel?.name}`,
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
}
