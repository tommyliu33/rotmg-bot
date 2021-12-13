/* eslint-disable @typescript-eslint/no-misused-promises */
import { inlineCode, time, userMention } from "@discordjs/builders";
import { createChannel, react, getGuildSetting, SettingsKey } from "@functions";
import EventEmitter from "@tbnritzdoge/events";
import { stripIndents } from "common-tags";
import { MessageEmbed, VoiceChannel } from "discord.js";

import { nanoid } from "nanoid";

// eslint-disable-next-line no-duplicate-imports
import type {
  EmojiResolvable,
  Snowflake,
  CommandInteraction,
  TextChannel,
} from "discord.js";
import type { Dungeon } from "../dungeons";

import { container } from "tsyringe";
import { kClient, kRedis } from "../tokens";
import type { Redis } from "ioredis";
import { Bot } from "@struct";

const redis = container.resolve<Redis>(kRedis);
const client = container.resolve<Bot>(kClient);

const title = (str: string) =>
  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();

// TODO: Refactor
const body = (dungeon: Dungeon): string => {
  const { portal, keys, optional_reacts, rusher } = dungeon;

  const body_ = stripIndents`
    To participate, join the voice channel and then react with ${portal}
		If you have ${
      keys.length === 4
        ? "runes/inc"
        : keys.length === 2
        ? "a key/vial"
        : "a key"
    } and are willing to pop, react to ${keys.map((k) => k.emote).join("")}

		To indicate class or gear choices, react below
    ${
      optional_reacts && optional_reacts.length >= 1
        ? `Please bring one of these items if you can: ${optional_reacts
            .map((c) => c.emote)
            .join("")}`
        : ""
    }  
    ${
      rusher
        ? `\nIf you can rush ${rusher.what}, react with ${rusher.emote}`
        : ""
    }
    ${
      dungeon.name === "shatters"
        ? "If you can do the Lights Out puzzle, react with <:LightsOutPuzzle:908439164087840819>"
        : ""
    }`;

  return `${body_
    .trim()
    .replace(
      "\n\n\n",
      "\n"
    )}\n\nTo end the afk check as the leader, react to ❌`;
};

export class Raids extends EventEmitter {
  public constructor() {
    super(); // eslint-disable-line constructor-super

    this.on("raidStart", this.raidStart.bind(null));
    this.on("raidEnd", this.raidEnd.bind(null));

    this.on("channelStart", this.channelStart.bind(null));
    this.on("channelOpen", this.channelOpen.bind(null));
    this.on("channelClose", this.channelClose.bind(null));
    this.on("channelLocked", this.channelLocked.bind(null));
    this.on("channelCapUpdate", this.channelCapUpdate.bind(null));
  }

  // #region Afk check
  private async raidStart(
    raid: Omit<Raid, "voiceChannelId" | "messageId" | "controlPanelId">
  ): Promise<void> {
    const { guildId, channelId, leaderName, leaderTag, leaderId } = raid;

    const vetChannelId = await getGuildSetting(
      guildId,
      SettingsKey.VetAfkCheck
    );

    const guild = await client.guilds.fetch(guildId).catch(() => undefined);

    const vet = channelId === vetChannelId;

    const key = vet ? `vet_raid:${guildId}` : `raid:${guildId}`;
    const voiceChannel = await createChannel(
      guild!,
      `Raiding ${await redis.incr(key)}`,
      vet,
      "GUILD_VOICE"
    );

    const cpChannel = await createChannel(
      guild!,
      leaderTag.replace("#", "-"),
      vet,
      "GUILD_TEXT"
    );
    await cpChannel.setTopic("raid");

    const channel = await guild?.channels
      .fetch(channelId)
      .catch(() => undefined);
    const channel_ = channel as TextChannel;

    const { images, color, name, full_name } = raid.dungeon;
    const embed = new MessageEmbed()
      .setDescription(body(raid.dungeon))
      .setTimestamp()
      .setColor(color)
      .setFooter(leaderName as string)
      .setTitle(inlineCode(full_name))
      .setThumbnail(images[Math.floor(Math.random() * images.length)]);

    const m = await channel_.send({
      content: stripIndents`
        @here ${leaderName} has started a ${title(name)} raid in ${
        voiceChannel.name
      }.`,
      allowedMentions: {
        parse: ["everyone"],
      },
      embeds: [embed],
    });
    await react(m, raid.reacts);

    const embed_ = new MessageEmbed()
      .setTitle(`${inlineCode(leaderTag)} Control Panel`)
      .addField("Location", "TBD");

    const m_ = await cpChannel.send({
      content: `${userMention(leaderId)}, this is your control panel.`,
      embeds: [embed_],
    });
    await m_.react("📝");
    await m_.react("🗺️");
    await m_.react("🛑");
    await m_.react("❌");

    // update cache
    await redis.set(
      `raid:${guildId}:${m.id}`,
      JSON.stringify({
        ...raid,
        messageId: m.id,
        controlPanelId: cpChannel.id,
        voiceChannelId: voiceChannel.id,
      })
    );
  }

  private async raidEnd(interaction: CommandInteraction, raid: Raid) {}
  // #endregion

  // #region Channels
  private async channelStart(
    interaction: CommandInteraction,
    channel: Omit<Channel, "messageId" | "voiceChannelId">
  ) {
    const { name } = channel;

    const m = await interaction.channel?.send({
      content: stripIndents`
        @here ${inlineCode(name)} is now starting.`,
      allowedMentions: {
        parse: ["everyone"],
      },
      embeds: [
        new MessageEmbed()
          .setFields([])
          .setColor("YELLOW")
          .setTitle(`${inlineCode(name)}`)
          .setDescription("Please wait for the channel to unlock."),
      ],
    });

    await redis.set(
      `channel:${interaction.user.id}`,
      JSON.stringify({
        ...channel,
        messageId: m?.id,
      })
    );
  }

  private async channelClose(
    interaction: CommandInteraction,
    channel: Channel
  ) {
    await redis.del(`channel:${interaction.user.id}`);

    const { name, channelId, voiceChannelId, messageId } = channel;
    const channel_ = await interaction.guild?.channels
      .fetch(voiceChannelId)
      .catch(() => {
        return undefined;
      });

    if (!(channel_ instanceof Map)) {
      await channel_?.delete();
    }

    const textChannel = await interaction.guild?.channels
      .fetch(channelId)
      .catch(() => {
        return undefined;
      });

    if (textChannel) {
      const msg = await (textChannel as TextChannel).messages
        .fetch(messageId)
        .catch(() => {
          return undefined;
        });

      await msg?.edit({
        content: " ",
        embeds: [
          new MessageEmbed(msg.embeds[0])
            .setFields([])
            .setColor("DARK_RED")
            .setTitle(inlineCode(name))
            .setDescription(`Channel closed ${time(new Date(), "R")}`),
        ],
      });
    }
  }

  private async channelOpen(interaction: CommandInteraction, channel: Channel) {
    const { name, channelId, voiceChannelId, messageId, roleId } = channel;
    const channel_ = await interaction.guild?.channels
      .fetch(voiceChannelId)
      .catch(() => {
        return undefined;
      });

    await channel_?.permissionOverwrites.edit(roleId, {
      CONNECT: true,
    });

    const textChannel = (await interaction.guild?.channels
      .fetch(channelId)
      .catch(() => {
        return undefined;
      })) as TextChannel;

    const m = await textChannel.send({
      content: `@here ${inlineCode(name)} has opened (re-ping)`,
      allowedMentions: {
        parse: ["everyone"],
      },
    });

    await m.delete().catch(() => {
      return undefined;
    });

    const msg_ = await textChannel.messages.fetch(messageId).catch(() => {
      return undefined;
    });

    if (msg_) {
      await msg_.edit({
        content: " ",
        embeds: [
          new MessageEmbed(msg_.embeds[0])
            .setFields([])
            .setColor("GREEN")
            .setTitle(inlineCode(name))
            .setDescription(`Channel opened ${time(new Date(), "R")}`),
        ],
      });
    }
  }

  private async channelLocked(
    interaction: CommandInteraction,
    channel: Channel
  ) {
    const { name, channelId, voiceChannelId, messageId, roleId } = channel;
    const channel_ = await interaction.guild?.channels
      .fetch(voiceChannelId)
      .catch(() => {
        return undefined;
      });

    await channel_?.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    const textChannel = (await interaction.guild?.channels
      .fetch(channelId)
      .catch(() => {
        return undefined;
      })) as TextChannel;

    const msg = await textChannel.messages.fetch(messageId).catch(() => {
      return undefined;
    });

    await msg?.edit({
      content: " ",
      embeds: [
        new MessageEmbed(msg.embeds[0])
          .setFields([])
          .setColor("RED")
          .setTitle(inlineCode(name))
          .setDescription(`Channel locked ${time(new Date(), "R")}`),
      ],
    });
  }

  private async channelCapUpdate(
    interaction: CommandInteraction,
    channel: Channel,
    cap: number
  ) {
    const { voiceChannelId } = channel;

    const vc = await interaction.guild?.channels
      .fetch(voiceChannelId)
      .catch(() => {
        return undefined;
      });

    const channel_ = vc as VoiceChannel;
    await channel_.setUserLimit(cap);
  }
  // #endregion
}

export interface Raid {
  dungeon: Dungeon;
  reacts: EmojiResolvable[];

  // this stores only limited reacts
  reacts_: {
    userId: Snowflake; // user id who reacted
    emoji: EmojiResolvable; // the emoji they reacted with
    state: 1 | 2 | 3; // whether they confirmed with the bot
    // TODO: enum for reacts confirmed
    // 1 for not confirmed but reacted
    // 2 for in progress - bot sent dm
    // 3 for yes - they said yes
  }[];

  location: string;

  guildId: Snowflake;
  channelId: Snowflake;
  voiceChannelId: Snowflake;
  controlPanelId: Snowflake;

  messageId: Snowflake;

  leaderId: Snowflake;
  leaderName?: string;
  leaderTag: string;
}

export interface Channel
  extends Omit<
    Raid,
    "dungeon" | "reacts" | "reacted" | "reacts_" | "controlPanelId"
  > {
  name: string;

  roleId: Snowflake;

  state: "LOCKED" | "CLOSED" | "OPENED";
}

export interface RaidEvents {
  raidStart: [
    raid: Omit<Raid, "voiceChannelId" | "messageId" | "controlPanelId">
  ];
  raidEnd: [interaction: CommandInteraction, raid: Raid];

  channelStart: [
    interaction: CommandInteraction,
    channel: Omit<Channel, "messageId" | "voiceChannelId" | "location">
  ];
  channelClose: [interaction: CommandInteraction, channel: Channel];
  channelLocked: [interaction: CommandInteraction, channel: Channel];
  channelOpen: [interaction: CommandInteraction, channel: Channel];
  channelCapUpdate: [
    interaction: CommandInteraction,
    channel: Channel,
    cap: number
  ];
}

// eslint-disable-next-line no-redeclare
export interface Raids {
  on<K extends keyof RaidEvents>(
    event: K,
    listener: (...args: RaidEvents[K]) => void
  ): this;
  on<S extends string | symbol>(
    event: Exclude<S, keyof RaidEvents>,
    listener: (...args: any[]) => void
  ): this;

  once<K extends keyof RaidEvents>(
    event: K,
    listener: (...args: RaidEvents[K]) => void
  ): this;
  once<S extends string | symbol>(
    event: Exclude<S, keyof RaidEvents>,
    listener: (...args: any[]) => void
  ): this;

  emit<K extends keyof RaidEvents>(event: K, ...args: RaidEvents[K]): boolean;
  emit<S extends string | symbol>(
    event: Exclude<S, keyof RaidEvents>,
    ...args: any[]
  ): boolean;

  off<K extends keyof RaidEvents>(
    event: K,
    listener: (...args: RaidEvents[K]) => void
  ): this;
  off<S extends string | symbol>(
    event: Exclude<S, keyof RaidEvents>,
    listener: (...args: any[]) => void
  ): this;

  removeAllListeners<K extends keyof RaidEvents>(event?: K): this;
  removeAllListeners<S extends string | symbol>(
    event?: Exclude<S, keyof RaidEvents>
  ): this;
}
