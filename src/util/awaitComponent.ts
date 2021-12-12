import { APIMessage } from "discord-api-types/v9";
import type {
  AwaitMessageCollectorOptionsParams,
  Client,
  InteractionExtractor,
  Message,
  MessageComponentType,
} from "discord.js";
import { Constants, InteractionCollector } from "discord.js"; // eslint-disable-line no-duplicate-imports

export async function awaitComponent<
  T extends MessageComponentType | keyof typeof Constants.MessageComponentTypes
>(
  client: Client,
  message: Message | APIMessage,
  options: AwaitMessageCollectorOptionsParams<T> = {}
): Promise<InteractionExtractor<T> | undefined> {
  // Adapted from https://github.com/discordjs/discord.js/blob/stable/src/structures/interfaces/TextBasedChannel.js#L246
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const collector = new InteractionCollector(client, {
      ...options,
      interactionType: Constants.InteractionTypes.MESSAGE_COMPONENT,
      message,
      max: 1,
    });

    collector.once("end", (interactions, reason) => {
      const interaction = interactions.first();
      if (interaction) resolve(interaction as InteractionExtractor<T>);
      else reject(new Error(reason));
    });
  });
}
