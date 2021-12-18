/* eslint-disable @typescript-eslint/no-misused-promises */
import { inlineCode, time, userMention, Embed } from "@discordjs/builders";
import { createChannel, react, getGuildSetting, SettingsKey } from "@functions";
import EventEmitter from "@tbnritzdoge/events";
import { stripIndents } from "common-tags";
import { MessageEmbed } from "discord.js"; // TODO: Refactor to use @discordjs/builders Embed
import { Collection } from "@discordjs/collection";
// eslint-disable-next-line no-duplicate-imports
import type {
  EmojiResolvable,
  Snowflake,
  CommandInteraction,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import type { Dungeon } from "../dungeons";

import { inject, injectable } from "tsyringe";
import { kClient, kRedis } from "../tokens";
import type { Redis } from "ioredis";
import type { Bot } from "@struct";
import { text } from "stream/consumers";

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

// also for custom raiding channels
@injectable()
export class RaidManager extends EventEmitter {
  public readonly raids: Collection<string, Raid>;
  public readonly channels: Collection<string, Channel>;
  public constructor(
    @inject(kRedis) public readonly redis: Redis,
    @inject(kClient) public readonly client: Bot
  ) {
    super();

    this.raids = new Collection();
    this.channels = new Collection();

    this.on("raidStart", this.raidStart.bind(this));
    this.on("raidEnd", this.raidEnd.bind(this));

    this.on("channelStart", this.channelStart.bind(this));
    this.on("channelOpen", this.channelOpen.bind(this));
    this.on("channelClose", this.channelClose.bind(this));
    this.on("channelLocked", this.channelLocked.bind(this));
    this.on("channelCapUpdate", this.channelCapUpdate.bind(this));
  }

  // #region Afk check
  private async raidStart(
    raid: Omit<
      Raid,
      | "voiceChannelId"
      | "messageId"
      | "controlPanelId"
      | "controlPanelMessageId"
    >
  ): Promise<void> {
    const { guildId, channelId, leaderName, leaderTag, leaderId } = raid;

    const vetChannelId = await getGuildSetting(
      guildId,
      SettingsKey.VetAfkCheck
    );

    const guild = await this.client.guilds
      .fetch(guildId)
      .catch(() => undefined);

    const vet = channelId === vetChannelId;

    const key = vet ? `vet_raid:${guildId}` : `raid:${guildId}`;
    const voiceChannel = await createChannel(
      guild!,
      `Raiding ${await this.redis.incr(key)}`,
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

    await this.raids.set(`raid:${guildId}:${m.id}`, {
      ...raid,
      messageId: m.id,
      controlPanelId: cpChannel.id,
      controlPanelMessageId: m_.id,
      voiceChannelId: voiceChannel.id,
    });

    // update cache
    await this.redis.set(
      `raid:${guildId}:${m.id}`,
      JSON.stringify({
        ...raid,
        messageId: m.id,
        controlPanelId: cpChannel.id,
        controlPanelMessageId: m_.id,

        voiceChannelId: voiceChannel.id,
      })
    );
  }

  private async raidEnd(raid: Raid) {
    const { channelId, voiceChannelId, messageId, dungeon, leaderName } = raid;

    const textChannel = this.client.channels.cache.get(
      channelId
    ) as TextChannel;
    const msg = await textChannel.messages.fetch(messageId).catch(() => {
      return undefined;
    });

    if (msg) {
      const voiceChannel = this.client.channels.cache.get(
        voiceChannelId
      ) as VoiceChannel;
      const embed = new MessageEmbed(msg.embeds[0])
        .setTitle("")
        .setThumbnail("")
        .setTimestamp()
        .setDescription(
          `${inlineCode(dungeon.full_name)} raid started in ${
            voiceChannel.name
          }`
        )
        .setFooter(`The afk check was ended by ${leaderName as string}`);
      await msg.edit({
        content: " ",
        embeds: [embed],
      });
      await msg.reactions.removeAll();
    }
  }
  // #endregion

  // #region Channels
  private async channelStart(channel: Omit<Channel, "messageId">) {
    const { name, channelId, leaderId } = channel;

    const channel_ = this.client.channels.cache.get(channelId) as TextChannel;

    const m = await channel_.send({
      content: stripIndents`
        @here ${inlineCode(name)} is now starting.`,
      allowedMentions: {
        parse: ["everyone"],
      },
      embeds: [
        new Embed()
          .setColor(0xfee75c)
          .setTitle(inlineCode(name))
          .setDescription("Please wait for the channel to unlock."),
      ],
    });

    await this.channels.set(`channel:${leaderId}`, {
      ...channel,
      messageId: m.id,
    });
  }

  private async channelClose(channel: Channel) {
    const { guildId, leaderId, channelId, voiceChannelId, messageId, name } =
      channel;
    await this.channels.delete(`channel:${leaderId}`);

    const guild = this.client.guilds.cache.get(guildId);

    const voiceChannel = guild?.channels.cache.get(voiceChannelId);
    if (voiceChannel) {
      await voiceChannel.delete();
    }

    const textChannel = guild?.channels.cache.get(channelId) as TextChannel;
    const message = textChannel.messages.cache.get(messageId);

    await message?.edit({
      content: " ",
      embeds: [
        new Embed()
          .setColor(0x992d22)
          .setTitle(inlineCode(name))
          .setDescription(`Channel closed ${time(new Date(), "R")}`),
      ],
    });
  }

  private async channelOpen(channel: Channel) {
    const { name, channelId, voiceChannelId, messageId, roleId } = channel;

    const voiceChannel = this.client.channels.cache.get(
      voiceChannelId
    ) as VoiceChannel;

    await voiceChannel.permissionOverwrites.edit(roleId, {
      CONNECT: true,
    });

    const textChannel = this.client.channels.cache.get(
      channelId
    ) as TextChannel;

    const m = await textChannel.send({
      content: `@here ${inlineCode(name)} has opened (re-ping)`,
      allowedMentions: {
        parse: ["everyone"],
      },
    });

    await m.delete().catch(() => {
      return undefined;
    });

    const msg = textChannel.messages.cache.get(messageId);
    await msg?.edit({
      content: " ",
      embeds: [
        new Embed()
          .setColor(0x57f287)
          .setTitle(inlineCode(name))
          .setDescription(`Channel opened ${time(new Date(), "R")}`),
      ],
    });
  }

  private async channelLocked(channel: Channel) {
    const { name, channelId, voiceChannelId, messageId, roleId } = channel;

    const voiceChannel = this.client.channels.cache.get(
      voiceChannelId
    ) as VoiceChannel;

    const textChannel = this.client.channels.cache.get(
      channelId
    ) as TextChannel;

    await voiceChannel.permissionOverwrites.edit(roleId, {
      CONNECT: false,
    });

    const msg = textChannel.messages.cache.get(messageId);

    await msg?.edit({
      content: " ",
      embeds: [
        new Embed()
          .setColor(0xed4245)
          .setTitle(inlineCode(name))
          .setDescription(`Channel locked ${time(new Date(), "R")}`),
      ],
    });
  }

  private async channelCapUpdate(channel: Channel, cap: number) {
    const { voiceChannelId } = channel;

    const voiceChannel = this.client.channels.cache.get(
      voiceChannelId
    ) as VoiceChannel;

    await voiceChannel.setUserLimit(cap);
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
  controlPanelMessageId: Snowflake;

  messageId: Snowflake; // the afk check msg id

  leaderId: Snowflake;
  leaderName?: string;
  leaderTag: string;
}

export interface Channel
  extends Omit<
    Raid,
    | "dungeon"
    | "reacts"
    | "reacted"
    | "reacts_"
    | "controlPanelId"
    | "controlPanelMessageId"
    | "location"
  > {
  name: string;

  roleId: Snowflake;

  state: "LOCKED" | "CLOSED" | "OPENED";
}

export interface RaidEvents {
  raidStart: [
    raid: Omit<
      Raid,
      | "voiceChannelId"
      | "messageId"
      | "controlPanelId"
      | "controlPanelMessageId"
    >
  ];
  raidEnd: [raid: Raid];

  channelStart: [channel: Omit<Channel, "messageId" | "location">];
  channelClose: [channel: Channel];
  channelLocked: [channel: Channel];
  channelOpen: [channel: Channel];
  channelCapUpdate: [channel: Channel, cap: number];
}

// eslint-disable-next-line no-redeclare
export interface RaidManager {
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
