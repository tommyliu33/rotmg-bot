import { inlineCode, time } from "@discordjs/builders";
import { createChannel, getGuildSetting, react, SettingsKey } from "@functions";
import EventEmitter from "@tbnritzdoge/events";
import { stripIndents } from "common-tags";
import { MessageEmbed, VoiceChannel } from "discord.js";
import TypedEmitter from "typed-emitter";

// eslint-disable-next-line no-duplicate-imports
import type {
  EmojiResolvable,
  Snowflake,
  CommandInteraction,
  TextChannel,
} from "discord.js";
import type { Dungeon } from "../dungeons";

import { container } from "tsyringe";
import { kRedis } from "../tokens";
import type { Redis } from "ioredis";

const redis = container.resolve<Redis>(kRedis);

const title = (str: string) =>
  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();

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

export class Raids extends (EventEmitter as new () => TypedEmitter<RaidEvents>) {
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

  private async raidStart(
    interaction: CommandInteraction,
    raid: Omit<Raid, "voiceChannelId" | "messageId">
  ): Promise<void> {
    if (interaction.replied || !interaction.deferred) return;

    const vetChannelId = await getGuildSetting(
      interaction.guildId,
      SettingsKey.VetAfkCheck
    );

    const key = vetChannelId
      ? `vet_raid_number:${interaction.guildId}`
      : `raid_number:${interaction.guildId}`;

    let number = await redis.get(key);
    if (!number) number = "1";

    const voiceChannel = await createChannel(
      interaction.guild!,
      `Raiding ${number}`,
      interaction.channelId === vetChannelId
    );

    if (!voiceChannel) return;

    await redis.set(key, Number(number) + 1);

    const { images, color, name, full_name } = raid.dungeon;

    const embed = new MessageEmbed()
      .setDescription(body(raid.dungeon))
      .setTimestamp()
      .setColor(color)
      .setFooter(raid.leaderName as string)
      .setTitle(inlineCode(full_name))
      .setThumbnail(images[Math.floor(Math.random() * images.length)]);

    await interaction.editReply({
      content: "Loading...",
    });
    await interaction.deleteReply();

    const channel = await interaction.guild?.channels
      .fetch(raid.channelId)
      .catch(() => {
        return undefined;
      });

    if (!channel) return;

    const channel_ = channel as TextChannel;
    const m = await channel_.send({
      content: stripIndents`
      @here ${raid.leaderName} has started a ${title(name)} raid in ${
        voiceChannel.name
      }.`,
      allowedMentions: {
        parse: ["everyone"],
      },
      embeds: [embed],
    });

    await react(m, raid.reacts);

    const key_ = `raid:${interaction.guildId}:${interaction.user.id}`;
    const info = await redis.get(key_);

    const raid_: Raid = JSON.parse(info!);
    await redis.set(
      key_,
      JSON.stringify({
        ...raid_,
        messageId: m.id,
        voiceChannelId: voiceChannel.id,
      })
    );
  }

  private async raidEnd(interaction: CommandInteraction, raid: Raid) {}

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
}

export interface Raid {
  dungeon: Dungeon;
  reacts: EmojiResolvable[];

  channelId: Snowflake;
  voiceChannelId: Snowflake;

  messageId: Snowflake;

  leaderId: Snowflake;
  leaderName?: string;
}

export interface Channel extends Omit<Raid, "dungeon" | "reacts"> {
  name: string;

  roleId: Snowflake;

  state: "LOCKED" | "CLOSED" | "OPENED";
}

type Awaitable<T> = T | PromiseLike<T>;
interface RaidEvents {
  raidStart: (
    interaction: CommandInteraction,
    raid: Omit<Raid, "voiceChannelId" | "messageId">
  ) => Awaitable<void>;
  raidEnd: (interaction: CommandInteraction, raid: Raid) => Awaitable<void>;

  channelStart: (
    interaction: CommandInteraction,
    channel: Omit<Channel, "messageId" | "voiceChannelId">
  ) => Awaitable<void>;
  channelClose: (
    interaction: CommandInteraction,
    channel: Channel
  ) => Awaitable<void>;
  channelLocked: (
    interaction: CommandInteraction,
    channel: Channel
  ) => Awaitable<void>;
  channelOpen: (
    interaction: CommandInteraction,
    channel: Channel
  ) => Awaitable<void>;
  channelCapUpdate: (
    interaction: CommandInteraction,
    channel: Channel,
    cap: number
  ) => Awaitable<void>;
}
