import { Guild, prompt, SettingsKey } from "@functions";
import type { Database } from "@lib";
import { stripIndents } from "common-tags";
import {
  ButtonInteraction,
  CommandInteraction,
  Formatters,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { ButtonComponent, Discord, Slash, SlashGroup } from "discordx";
import { get } from "dot-prop";
import type { Redis } from "ioredis";
import { container, inject, injectable } from "tsyringe";
import { kDatabase, kRedis } from "../../../tokens";

const required: {
  key: string;
  key_: SettingsKey;
  msg: string;
  prompt: string;
}[] = [
  {
    key: "channels.afk_check",
    key_: SettingsKey.AfkCheck,
    msg: "the main afk check channel (`/config afk-check`)",
    prompt: "Enter a channel for the main afk check channel.",
  },
  {
    key: "user_roles.main",
    key_: SettingsKey.MainUserRole,
    msg: "the verified raider role (`/config verified-role`)",
    prompt: "Enter a role for the verified raider role.",
  },
  {
    key: "categories.main",
    key_: SettingsKey.MainCategory,
    msg: "the main raiding section (`/config main-section`)",
    prompt: "Enter a channel for the main raiding section.",
  },
];

function getEmptyValues(object: Record<string, string>): typeof required {
  const emptyValues = [];

  console.log("object", object);

  for (const [index] of Object.entries(Object.entries(object))) {
    const value = get(object, Reflect.get(required, index)?.key);
    if (value === "" || !value) {
      console.log(Reflect.get(required, index));
      emptyValues.push(Reflect.get(required, index));
    } else {
      console.log("value", value);
    }
  }

  return emptyValues;
}

const yesId = "yes-btn";
const noId = "no-btn";

const yesButton = new MessageButton()
  .setCustomId(yesId)
  .setStyle("PRIMARY")
  .setLabel("Yes");

const noButton = new MessageButton()
  .setCustomId(noId)
  .setStyle("DANGER")
  .setLabel("No");

@injectable()
@Discord()
@SlashGroup("config")
export class ConfigSetupCommand {
  public constructor(@inject(kRedis) public readonly redis: Redis) {
    this.redis = container.resolve<Redis>(kRedis);
  }

  @Slash("setup")
  private async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    const db = container.resolve<Database>(kDatabase);
    const entry = (await db.guilds.findOne({
      id: interaction.guildId,
    })) as unknown as Guild;

    const data = Object.keys(entry)
      .filter((c) => c === "rotmg" || c === "moderation")
      .map((c) => Reflect.get(entry, c))[0];

    const missing = getEmptyValues(data);
    if (!missing.length) {
      console.log("missing", missing);
      await interaction.editReply({
        content: `${interaction.guild?.name} is ready for raiding!`,
      });
      return;
    } else {
      this.redis.set(
        `config-setup-prompt:${interaction.guildId}:${interaction.user.id}`,
        JSON.stringify(missing)
      );

      console.log("missing", missing);
      await interaction.editReply({
        content: stripIndents`
           ${Formatters.bold(
             interaction.guild?.name!
           )} is currently missing the following settings:
          ${missing.map((c) => `⤷ ${c.msg}`).join("\n")}
          
          React yes or no to set them up right now.
          `,
        components: [new MessageActionRow().addComponents(yesButton, noButton)],
      });
    }
  }

  @ButtonComponent(yesId)
  private async yes(interaction: ButtonInteraction) {
    const prompt_ = await this.redis.get(
      `config-setup-prompt:${interaction.guildId}:${interaction.user.id}`
    );
    if (!prompt_) {
      return interaction.reply({
        content: stripIndents`
          An unexpected error occured while trying to setup prompts.
          Try again.`,
        ephemeral: true,
      });
    }

    const m = await interaction.reply({
      content: "Loading...",
      fetchReply: true,
    });

    const data: typeof required = JSON.parse(prompt_);
    console.log("data", data);

    const prompts = data.map((c) => ({
      question: c.prompt,
      expected: "",
    }));
    console.log(prompts);

    const res = await prompt(interaction, prompts, []).catch(
      async () =>
        await interaction.editReply({
          content: stripIndents`
          An error occured while prompting.
          Try again.`,
        })
    );

    console.log(res);
  }

  @ButtonComponent(noId)
  private no(interaction: ButtonInteraction) {
    interaction.reply({ content: "you pressed no !" });
  }
}
