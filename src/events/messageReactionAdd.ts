import { Event, Raid } from "@struct";
import type { User, VoiceChannel, Snowflake, TextChannel } from "discord.js";

// eslint-disable-next-line no-duplicate-imports
import {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageReaction,
} from "discord.js";
import { inlineCode, hyperlink } from "@discordjs/builders";
import { oneLine } from "common-tags";
import { nanoid } from "nanoid";

import { inject, injectable } from "tsyringe";
import { kRedis } from "../tokens";
import type { Redis } from "ioredis";
import { prompt } from "@functions";

const MESSAGE_URL = (
  guildId: Snowflake,
  channelId: Snowflake,
  messageId: Snowflake
) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

@injectable()
export default class implements Event {
  public name = "messageReactionAdd";

  public constructor(@inject(kRedis) public readonly redis: Redis) {}

  public async execute(react: MessageReaction, user: User) {
    if (!react.message.guild || user.bot) return;

    if (react.partial) await react.fetch(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    if (user.partial) await user.fetch(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition

    if (!react.message.embeds[0]) return;

    // afk check message id
    const messageId = react.message.embeds[0].footer?.text as string;

    // #region End afk check
    const raid = await this.redis.get(
      `raid:${react.message.guildId as string}:${messageId}`
    );
    if (raid) {
      const {
        dungeon,
        voiceChannelId,
        messageId,
        leaderId,
        leaderName,
        reacts_,
        channelId,
        controlPanelId,
        controlPanelMessageId,
      }: Raid = JSON.parse(raid);

      // #region Leader end afk
      if (
        react.emoji.name === "❌" &&
        react.message.id === messageId &&
        user.id === leaderId
      ) {
        await this.redis.del(`raid:${leaderId}:${messageId}`);

        // TODO: lock the channel

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
        await react.message.reactions.removeAll();
      }
      // #endregion

      // #region Leader control panel reacts
      if (react.message.channelId === controlPanelId && user.id === leaderId) {
        const channel = react.message.guild.channels.cache.get(
          controlPanelId
        ) as TextChannel;
        if (react.emoji.toString() === "📝") {
          const res = await prompt(
            channel,
            {
              filter: (m) => m.author.id === leaderId,
              max: 1,
              time: 15000,
              errors: ["time"],
            },
            ["Enter a new location for the raid."]
          );

          if (res[0].response) {
            await this.redis.set(
              `raid:${react.message.guildId as string}:${messageId}`,
              JSON.stringify({ ...JSON.parse(raid), location: res[0].response })
            );

            const msg = channel.messages.cache.get(controlPanelMessageId);
            const embed = new MessageEmbed(msg?.embeds[0]).setFields({
              name: "Location",
              value: res[0].response,
            });
            await msg?.edit({ content: " ", embeds: [embed] });
          }
        }

        // switch (react.emoji.toString()) {
        //   case "📝":
        //     break;
        //   case "🗺️":
        //     break;
        //   case "❌":
        //     break;
        //   case "🛑":
        //     break;
        // }
      }

      // #endregion

      // #region User confirmation react
      if (react.message.channelId === channelId) {
        const confirmationReacts = [
          ...dungeon.keys,
          ...dungeon.main_reacts,
          ...(dungeon.optional_reacts ?? []),
        ].filter((r) => r.limit !== 0);

        if (confirmationReacts.length > 0) {
          if (
            !confirmationReacts.find(
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

          reacts_.push({
            userId: user.id,
            emoji: react.emoji.toString(),
            state: 1,
          });

          await this.redis.set(
            `raid:${react.message.guildId as string}:${react.message.id}`,
            JSON.stringify({
              ...JSON.parse(raid),
              reacts_,
            })
          );

          // console.log(
          //   "reacts before it all",
          //   JSON.parse(
          //     await redis.get(
          //       `raid:${react.message.guildId as string}:${react.message.id}`
          //     )
          //   )
          // );

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
              const index = reacts_.findIndex((r) => r.userId === user.id);
              reacts_.splice(index, 1);

              await this.redis.set(
                `raid:${react.message.guildId as string}:${react.message.id}`,
                JSON.stringify({
                  ...JSON.parse(raid),
                  ...reacts_,
                })
              );

              await m.edit({
                embeds: [
                  embed
                    .setDescription(
                      oneLine`
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

              await this.redis.set(
                `raid:${react.message.guildId as string}:${react.message.id}`,
                JSON.stringify({
                  ...JSON.parse(raid),
                  reacts_,
                })
              );

              console.log(
                "reacts after timing out",
                JSON.parse(
                  await this.redis.get(
                    `raid:${react.message.guildId as string}:${
                      react.message.id
                    }`
                  )
                )
              );

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

            console.log(
              "after confirming",
              JSON.parse(
                await this.redis.get(
                  `raid:${react.message.guildId as string}:${react.message.id}`
                )
              )
            );
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

            const index = reacts_.findIndex((r) => r.userId === user.id);
            reacts_.splice(index, 1);

            await this.redis.set(
              `raid:${react.message.guildId as string}:${react.message.id}`,
              JSON.stringify({
                ...JSON.parse(raid),
                reacts_,
              })
            );

            console.log(
              "after denying",
              JSON.parse(
                await this.redis.get(
                  `raid:${react.message.guildId as string}:${react.message.id}`
                )
              )
            );
          }
        }
      }

      // #endregion
    }
    // #endregion
  }
}
