import type { VoiceChannel } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import { kRedis } from "../../tokens";

@Discord()
@injectable()
export class Event {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @On("messageReactionAdd")
  private async execute([m, u]: ArgsOf<"messageReactionAdd">) {
    if (!m.message.guild || u.bot) return;

    if (m.partial) await m.fetch();
    if (u.partial) await u.fetch();

    //#region afkcheck
    const raid = await this.redis.get(`raid:${u.id}:${m.message.id}`);
    if (raid) {
      const { dungeon, reacts, vcId, msgId, leaderId } = JSON.parse(raid);
      if (
        m.emoji.name === "❌" &&
        m.message.id === msgId &&
        u.id === leaderId
      ) {
        await this.redis.del(`raid:${leaderId}:${m.message.id}`);
        await m.message.edit({
          content: "afk check ended",
          embeds: [],
        });
        await m.message.reactions.removeAll();

        const channel = (await m.message.guild.channels.fetch(
          vcId
        )) as VoiceChannel;

        const portal = m.message.reactions.cache.find(
          (c) => `<:${c.emoji.identifier}>` === dungeon.portal
        );
        if (portal?.partial) await portal?.fetch();

        const reacted = portal?.users.cache.filter((u) => !u.bot)!;
        for (const member of channel.members.values()) {
          if (!reacted.has(member.user.id)) await member.voice.setChannel(null);
        }
      }

      // TODO: confirmation
    } else {
      console.log("no raid");
    }
    //#endregion
  }
}
