import { CommandInteraction, MessageEmbed, Snowflake } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { prompt, PromptOptions } from "@functions";

// TODO

const PROMPTS: PromptOptions[] = [
  {
    question: "What message do you want for the AFK Check?",
    expected: "n/a",
  },
];

@Discord()
@SlashGroup("template", "create and view templates for custom channels")
export abstract class PingCommand {
  @Slash("create", {
    description: "create a template",
  })
  private async create(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the template",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const res = await prompt(interaction, PROMPTS, []);

    if (res[0].response) {
      const member = await interaction.guild?.members.fetch(
        interaction.user.id
      );

      const embed = new MessageEmbed()
        .setDescription(res[0].response)
        .setAuthor(
          member?.displayName!,
          member?.user.displayAvatarURL({ dynamic: true })
        )
        .setColor(member?.displayColor ?? 0);

      await interaction.editReply({
        content: "Preview",
        embeds: [embed],
      });

      await interaction.followUp({
        ephemeral: true,
        content: `Template \`${name}\` created.`,
      });
    }

    console.log("res in command", res);
    return;

    // TODO: actually save the template
  }

  @Slash("view", {
    description: "view a raiding template",
  })
  private async view(
    @SlashOption("name", {
      type: "STRING",
      required: true,
      description: "Name of the template",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.reply("view " + name);
  }

  // @ts-ignore
  @Slash("embed_tutorial", {
    description: "tutorial for building embeds and using them for templates",
  })
  private async embedTutorial(interaction: CommandInteraction): Promise<void> {
    await interaction.reply("hello world");
  }
}

interface RaidTemplate {
  title: string;
  reacts: string[];
  author: Snowflake;
  body: string;
}
