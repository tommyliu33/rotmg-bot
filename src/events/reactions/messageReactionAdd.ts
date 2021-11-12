import { Formatters, MessageEmbed, VoiceChannel } from "discord.js";
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

        const member = await m.message.guild.members
          .fetch(leaderId)
          .catch(() => {});

        console.log(
          `${dungeon.name.charAt(0).toUpperCase()}${dungeon.name
            .slice(1)
            .toLowerCase()}`
        );

        const embed = new MessageEmbed(m.message.embeds[0]!)
          .setAuthor(
            `${dungeon.full_name} raid has been ended by ${member?.displayName}`,
            member?.user.displayAvatarURL({ dynamic: true })!
          )
          .setDescription(
            [
              `Raid has started in ${channel.toString()} ${Formatters.time(
                new Date(),
                "R"
              )}`,
              `Raid starting with ${channel.members.size.toString()} raiders`,
              "Please wait for the next AFK Check to begin.",
            ].join("\n")
          )
          .setFooter(`The afk check has been ended by ${member?.displayName}`);

        await m.message.edit({
          content: " ",
          embeds: [embed],
        });
      }

      // TODO: confirmation
    }
    //#endregion
  }
}
