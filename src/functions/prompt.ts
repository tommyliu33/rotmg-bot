import type { CommandInteraction, Message } from "discord.js";

export interface PromptOptions {
  question: string;
  expected: string;
}

interface PromptResponses {
  question: string;
  response: string;
}

export async function prompt(
  interaction: CommandInteraction,
  prompts: PromptOptions[],
  previousResponses: PromptResponses[],
  index = 0
): Promise<PromptResponses[]> {
  let currentIndex = index;
  const expectedIndex = prompts.length;

  console.log(`${currentIndex}|${require("util").inspect(previousResponses)}`);

  const responses = [...previousResponses];

  try {
    console.log(`starting ${currentIndex}/${expectedIndex}`);
    const { question } = prompts[index];

    await interaction.editReply({
      content: question,
    });

    const filter = (m: Message) => m.author.id === interaction.user.id;

    await interaction.channel
      ?.awaitMessages({
        filter,
        max: 1,
        time: 15000,
        errors: ["time"],
      })
      .then(async (res) => {
        //console.log("res", res);

        if (res.first()?.content.toLowerCase() === "cancel") {
          return responses;
        }

        responses.push({
          question,
          response: res.first()?.content!,
        });
        currentIndex += 1;

        if (currentIndex !== expectedIndex) {
          await prompt(interaction, prompts, responses, currentIndex);
          console.log(
            `${currentIndex}/${expectedIndex} - required to go again`
          );
        } else {
          console.log(
            `at ${currentIndex}/${expectedIndex} got it all returning`
          );
          return responses;
        }
      })
      .catch(async (err) => {
        await prompt(interaction, prompts, responses, currentIndex);
        console.log(`[error] :: ${err}`);
      });
  } catch (e) {
    await prompt(interaction, prompts, responses, currentIndex);
    console.log("repompting after error");
    console.log(`error inside try-catch ${e}`);
  }
}
