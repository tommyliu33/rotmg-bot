import {
  Collection,
  CommandInteraction,
  Formatters,
  Message,
  Snowflake,
} from "discord.js";

export interface PromptOptions {
  question: string;
  expected: string;
}

interface PromptResponses {
  question: string;
  response: string;
}

const WARNING_STRING =
  "\nYou have 15 seconds to answer. Type `cancel` to cancel.";

export async function prompt(
  interaction: CommandInteraction,
  prompts: PromptOptions[],
  responses: PromptResponses[],
  index = 0
): Promise<PromptResponses[]> {
  let currentIndex = index;
  const expectedIndex = prompts.length;

  if (responses.length === expectedIndex) return responses;

  const { question } = prompts[currentIndex];

  await interaction.editReply({
    content: `${question}\nYou have 15 seconds to answer. Type ${Formatters.inlineCode(
      "cancel"
    )} to cancel.`,
  });

  const filter = (m: Message) => m.author.id === interaction.user.id;
  const collector = await interaction.channel
    ?.awaitMessages({
      filter,
      max: 1,
      time: 15000,
      errors: ["time"],
    })
    .catch(async () => {
      await interaction.editReply("Exiting due to no response.");
    });

  if (!collector) return [];
  const collected = collector as Collection<Snowflake, Message>;

  const msg = collected.first()!;
  if (msg.content.toLowerCase() === "cancel") {
    await interaction.editReply("cancelling");
    return responses;
  }

  responses.push({
    question,
    response: msg.content,
  });

  if (msg.deletable) await msg.delete();

  ++currentIndex;
  if (!responses[expectedIndex]) {
    await prompt(interaction, prompts, responses, currentIndex);
  }

  return responses;
}
