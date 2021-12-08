import type { User, VoiceChannel, Snowflake } from "discord.js";
import { Event, Raid, Raids } from "@struct";

// eslint-disable-next-line no-duplicate-imports
import {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageReaction,
} from "discord.js";
import { inlineCode, hyperlink } from "@discordjs/builders";
import { oneLine, stripIndents } from "common-tags";
import { nanoid } from "nanoid";

import { container } from "tsyringe";
import { kRedis, kRaids } from "../tokens";
import type { Redis } from "ioredis";

const redis = container.resolve<Redis>(kRedis);
const emitter = container.resolve<Raids>(kRaids);

const MESSAGE_URL = (
  guildId: Snowflake,
  channelId: Snowflake,
  messageId: Snowflake
) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

export default class implements Event {
  public name = "messageReactionAdd";

  public async execute(react: MessageReaction, user: User) {
    if (!react.message.guild || user.bot) return console.log("here");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (react.partial) await react.fetch();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (user.partial) await user.fetch();

    // #region End afk check
    const raid = await redis.get(
      `raid:${react.message.guildId as string}:${react.message.id}`
    );
    if (raid) {
      const { dungeon, voiceChannelId, messageId, leaderId, leaderName }: Raid =
        JSON.parse(raid);

      // #region Leader end afk
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
          .setTimestamp()
          .setDescription(
            `${inlineCode(dungeon.full_name)} raid started in ${channel.name}`
          )
          .setFooter(`The afk check was ended by ${leaderName as string}`);

        await react.message.edit({
          content: " ",
          embeds: [embed],
        });
      }
      // #endregion

      // #region User confirmation react
      const confirmationReacts = [
        ...dungeon.keys,
        ...dungeon.main_reacts,
        ...(dungeon.optional_reacts ?? []),
      ].filter((r) => r.limit !== 0);

      console.log("confirmationReacts", confirmationReacts);
      if (confirmationReacts.length > 0) {
        console.log(`<:${react.emoji.identifier}>`);
        if (
          !confirmationReacts.find(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            (c) => c.emote === `<:${react.emoji.identifier}>`
          )
        )
          return;

        const dmChannel = await user.createDM().catch(() => undefined);

        const embed = new MessageEmbed();

        const yesId = nanoid();
        const yesButton = new MessageButton()
          .setCustomId(yesId)
          .setLabel("Yes")
          .setStyle("SUCCESS");

        const noId = nanoid();
        const noButton = new MessageButton()
          .setCustomId(noId)
          .setLabel("No")
          .setStyle("DANGER");

        const emojiName = react.emoji.name
          ?.toString()
          .match(/[A-Z][a-z]+|[0-9]+/g)
          ?.join(" ");

        const m = await dmChannel?.send({
          embeds: [
            embed.setDescription(
              oneLine`
              Confirm your ${react.emoji.toString()} (${inlineCode(
                emojiName as string
              )}) react.`
            ),
          ],
          components: [
            new MessageActionRow().addComponents([yesButton, noButton]),
          ],
        });

        const collected = await m
          ?.awaitMessageComponent({
            filter: async (i) => {
              await i.deferUpdate();
              return i.user.id === user.id;
            },
            componentType: "BUTTON",
            time: 15000,
          })
          .catch(async () => {
            await m.edit({
              embeds: [
                embed
                  .setDescription(
                    stripIndents`
                Timed out. 
                Re-react to ${react.emoji.toString()} ${hyperlink(
                      "here",
                      MESSAGE_URL(
                        react.message.guildId as string,
                        react.message.channelId,
                        react.message.id
                      )
                    )} if you forgot to confirm.`
                  )
                  .setColor("DARK_RED"),
              ],
              components: [],
            });
            return undefined;
          });

        if (collected?.customId === yesId) {
          await m?.edit({
            components: [],
            embeds: [
              embed
                .setDescription(
                  `You confirmed your ${react.emoji.toString()} reaction.`
                )
                .setColor("GREEN"),
            ],
          });

          // TODO: show rl that raider confirmed their react
        } else if (collected?.customId === noId) {
          await m?.edit({
            components: [],
            embeds: [
              embed
                .setDescription(
                  `You cancelled your ${react.emoji.toString()} reaction.`
                )
                .setColor("RED"),
            ],
          });
          await react.users.remove(user.id);
        }
      }

      // #endregion
    }
    // #endregion
  }
}
