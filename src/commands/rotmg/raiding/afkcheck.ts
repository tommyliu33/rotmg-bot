import { createChannel, react } from "@functions";
import { AfkCheckChannel } from "@guards";
import {
  CommandInteraction,
  EmojiResolvable,
  Formatters,
  GuildTextBasedChannel,
  Message,
  MessageEmbed,
  Role,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import type { Redis } from "ioredis";
import { container, inject } from "tsyringe";
import { dungeons } from "../../../dungeons";
import {
  getGuildSetting,
  SettingsKey,
} from "../../../functions/settings/getGuildSetting";
import { kRedis } from "../../../tokens";
import { afkCheckEmbed } from "../../../util/embeds";

enum DungeonChoices {
  "The Shatters" = "shatters",
  "The Void" = "void",
  "The Nest" = "nest",
  "Cultist Hideout" = "cult",
  "Fungal Cavern" = "fungal",
  "Oryx Sanctuary" = "o3",
}

@Discord()
export class Command {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @Guard(AfkCheckChannel())
  @Slash("afkcheck", { description: "start an afkcheck" })
  private async execute(
    @SlashChoice(DungeonChoices)
    @SlashOption("dungeon", {
      type: "STRING",
      required: true,
      description: "Name of the dungeon",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const dungeon = dungeons[dungeons.findIndex((d) => d.name === name)];
    if (!dungeon) {
      await interaction.editReply("dungeon unavailable");
      return;
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const vetChannelId = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck
    );

    const channel = await createChannel(
      interaction.guild!,
      `${name.charAt(0).toUpperCase()}${name
        .slice(1)
        .toLowerCase()} | ${member?.displayName!}`,
      interaction.channelId === vetChannelId
    );

    if (!channel) {
      await interaction.reply({
        content:
          "Unable to create the voice channel because of missing permissions or there was no category associated with the lounge.",
        ephemeral: true,
      });
      return;
    }

    const embed = this.finialize(
      afkCheckEmbed(dungeon).setTimestamp(),
      interaction.guild?.roles.premiumSubscriberRole!
    );

    const msg = (await interaction.reply({
      content: `@here ${Formatters.inlineCode(
        dungeon.full_name
      )} ${channel.toString()}`,
      embeds: [embed],
      allowedMentions: {
        parse: ["everyone"],
      },
      fetchReply: true,
    })) as Message;

    const { portal, keys, main_reacts, optional_reacts, rusher } = dungeon;
    const reacts: EmojiResolvable[] = [
      portal,
      ...keys.map((c) => c.emote),
      dungeon.name === "shatters" ? rusher?.emote! : "",
      dungeon.name === "shatters"
        ? "<:LightsOutPuzzle:908439164087840819>"
        : "",
      ...main_reacts.map((c) => c.emote),
    ];

    if (optional_reacts) {
      reacts.push(...optional_reacts.map((c) => c.emote));
    }

    // TODO: better
    if (dungeon.name !== "shatters" && rusher) {
      reacts.push(rusher.emote);
    }

    const data = {
      dungeon,
      reacts,
      vcId: channel.id,
      msgId: msg.id,
      leaderId: interaction.user.id,
    };

    this.redis.set(
      `raid:${interaction.user.id}:${msg.id}`,
      JSON.stringify(data)
    );

    if (interaction.guild?.roles.premiumSubscriberRole!) {
      reacts.push("<:NitroBooster:888634863140339824>");
    }
    reacts.push("❌");

    await react(msg, reacts);

    // todo: control panel
    this.controlPanel(interaction);
  }

  private finialize(embedData: MessageEmbed, role: Role): MessageEmbed {
    const embed = new MessageEmbed(embedData);

    if (role) {
      embed.description += `If you have the ${role.toString()}, react with <:nitro:888634863140339824> to get moved in.`;
    }

    embed.setDescription(
      `${embed.description}To end the afk check as the leader, react to ❌`
    );

    return embed;
  }

  private async controlPanel(interaction: CommandInteraction) {
    // TODO: Finish this
    const channel = interaction.channel as GuildTextBasedChannel;
    const cpChannel = await interaction.guild?.channels.create(
      `${interaction.user.username}-${interaction.user.discriminator}`,
      {
        type: "GUILD_TEXT",
        parent: channel?.parentId!,
      }
    );
    await cpChannel?.send("This is your control panel channel");
  }
}
