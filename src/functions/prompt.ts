import type {
  ButtonInteraction,
  CommandInteraction,
  Message,
} from "discord.js";

import { stripIndents } from "common-tags";
import { inlineCode } from "@discordjs/builders";

interface PromptResponses {
  question: string;
  response: string;
}

export async function prompt(
  interaction: CommandInteraction | ButtonInteraction,
  prompts: string[],
  responses: PromptResponses[],
  index = 0
): Promise<PromptResponses[]> {
  let currentIndex = index;
  const expectedIndex = prompts.length;

  if (responses.length === expectedIndex) {
    await interaction.deleteReply();
    return responses;
  }

  const question = prompts[currentIndex];

  await interaction.editReply({
    content: stripIndents`
      ${question}
      You have 15 seconds to answer. Type ${inlineCode("cancel")} to abort.
    `,
    components: [],
    embeds: [],
  });

  const filter = (m: Message) => m.author.id === interaction.user.id;
  const collectedMessage = await interaction.channel
    ?.awaitMessages({
      filter,
      max: 1,
      time: 15000,
      errors: ["time"],
    })
    .catch(() => undefined);

  const msg = collectedMessage?.first();
  if (msg?.content.toLowerCase() === "cancel") {
    await interaction.editReply("Cancelling...");
    if (msg.deletable) await msg.delete();

    return responses;
  }

  responses.push({
    question,
    response: msg?.content as string,
  });

  if (msg?.deletable) await msg.delete();

  ++currentIndex;
  if (!responses[expectedIndex]) {
    await prompt(interaction, prompts, responses, currentIndex);
  }

  return responses;
}
