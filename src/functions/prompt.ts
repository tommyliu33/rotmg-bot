import { inlineCode } from "@discordjs/builders";
import { stripIndents } from "common-tags";
import type { AwaitMessagesOptions, Message, TextChannel } from "discord.js";

interface PromptResponses {
  question: string;
  response: string;
}

export async function prompt(
  channel: TextChannel,
  options: AwaitMessagesOptions,
  prompts: string[],
  responses: PromptResponses[] = [],
  message?: Message,
  index = 0
): Promise<PromptResponses[]> {
  let currentIndex = index;
  const expectedIndex = prompts.length;

  if (responses.length === expectedIndex) {
    if (message?.deletable) await message.delete();
    return responses;
  }

  const question = prompts[currentIndex];

  // prompt msg
  let msg: Message;
  if (!message) {
    msg = await channel.send({
      content: stripIndents`
        ${question}
        You have 15 seconds to answer. Type ${inlineCode("cancel")} to abort.
      `,
    });
  }

  const collectedMessage = await channel
    .awaitMessages(options)
    .catch(() => undefined);

  const msg_ = collectedMessage?.first();
  if (msg_?.content.toLowerCase() === "cancel") {
    await msg!.edit({ content: "Cancelling..." });
    if (msg!.deletable) await msg!.delete();

    return responses;
  }

  responses.push({
    question,
    response: msg_?.content as string,
  });

  if (msg_?.deletable) await msg_.delete();

  ++currentIndex;
  if (!responses[expectedIndex]) {
    await prompt(channel, options, prompts, responses, msg!, currentIndex);
  }

  return responses;
}
