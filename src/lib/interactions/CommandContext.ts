import { Bot } from "@lib";
import type { APIMessage } from "discord-api-types/v9";
import type {
  CommandInteraction,
  InteractionReplyOptions,
  NewsChannel,
  TextChannel,
  ThreadChannel,
  User,
} from "discord.js";
import { Guild, Message, MessageEmbed } from "discord.js";

type MessageChannel = TextChannel | ThreadChannel | NewsChannel;

export class CommandContext {
  public readonly interaction: CommandInteraction;

  public constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  public get client(): Bot {
    return this.interaction.client as Bot;
  }

  public get guild(): Guild | null {
    return this.interaction.guild;
  }

  public get user(): User {
    return this.interaction.user;
  }

  public get channel(): MessageChannel {
    return this.interaction.channel as MessageChannel;
  }

  /* no fetch reply */
  public reply(
    content: MessageEmbed,
    options?: Omit<InteractionReplyOptions, "embeds">
  ): Promise<void>;
  public reply(
    content: string,
    options?: Omit<InteractionReplyOptions, "content">
  ): Promise<void>;
  public reply(options: InteractionReplyOptions): Promise<void>;

  /* fetch reply */
  public reply(
    content: MessageEmbed,
    options?: Omit<InteractionReplyOptions, "embeds"> & { fetchReply: true }
  ): Promise<Message | APIMessage>;
  public reply(
    content: string,
    options?: Omit<InteractionReplyOptions, "content"> & { fetchReply: true }
  ): Promise<Message | APIMessage>;
  public reply(
    options: InteractionReplyOptions & { fetchReply: true }
  ): Promise<Message | APIMessage>;

  public reply(
    content: string | MessageEmbed | InteractionReplyOptions,
    options: InteractionReplyOptions = {}
  ): Promise<any> {
    if (typeof content === "string" || content instanceof MessageEmbed) {
      return this.interaction.reply({
        [typeof content === "string" ? "content" : "embeds"]:
          typeof content === "string" ? content : [content],
        ...options,
      });
    }

    return this.interaction.reply(content);
  }
}
