import type { MessageReaction, User, VoiceChannel } from "discord.js";
import type { Event, Raid } from "@struct";

import { MessageEmbed } from "discord.js"; // eslint-disable-line no-duplicate-imports
import { time } from "@discordjs/builders";

import { container } from "tsyringe";
import { kRedis } from "../tokens";
import type { Redis } from "ioredis";

const redis = container.resolve<Redis>(kRedis);

export default class implements Event {
  public name = "messageReactionAdd";

  public async execute(react: MessageReaction, user: User) {
    if (!react.message.guild || user.bot) return;

    if (react.partial) await react.fetch(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    if (user.partial) await user.fetch(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition

    // #region afkcheck
    const raid = await redis.get(
      `raid:${react.message.guildId as string}:${user.id}`
    );
    if (raid) {
      const { dungeon, voiceChannelId, messageId, leaderId, leaderName }: Raid =
        JSON.parse(raid);

      if (
        react.emoji.name === "❌" &&
        react.message.id === messageId &&
        user.id === leaderId
      ) {
        await redis.del(`raid:${leaderId}:${messageId}`);

        const channel = await react.message.guild.channels
          .fetch(voiceChannelId)
          .catch(() => {
            return undefined;
          });

        if (!channel) return;

        const channel_ = channel as VoiceChannel;
        const portal = react.message.reactions.cache.find(
          (c) => `<:${c.emoji.identifier}>` === dungeon.portal
        );
        if (portal?.partial) await portal?.fetch(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition

        const reacted = portal?.users.cache.filter((u) => !u.bot);
        for (const member of channel_.members.values()) {
          if (!reacted?.has(member.user.id))
            await member.voice.setChannel(null);
        }

        const embed = new MessageEmbed(react.message.embeds[0])
          .setTitle("")
          .setThumbnail("")
          .setDescription(
            `Raid has started in ${channel.name} ${time(new Date(), "R")}`
          )
          .setFooter(`The afk check has been ended by ${leaderName}`);

        await react.message.edit({
          content: " ",
          embeds: [embed],
        });
      }

      // TODO: confirmation
    }
    // #endregion
  }
}
