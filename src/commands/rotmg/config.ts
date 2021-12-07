import { Command } from "@struct";
import type {
  CommandInteraction,
  Message,
  ButtonInteraction,
} from "discord.js";

// eslint-disable-next-line no-duplicate-imports
import {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageMentions,
} from "discord.js";
import {
  inlineCode,
  channelMention,
  roleMention,
  codeBlock,
} from "@discordjs/builders";
import { getGuild, prompt } from "@functions";
import { stripIndents } from "common-tags";

const map = [
  {
    key: "main_section_id",
    name: "Main section",
    description: "The main raiding section",
    type: "category",
  },
  {
    key: "veteran_section_id",
    name: "Veteran section",
    description: "The veteran raiding section",
    type: "category",
  },
  {
    key: "afk_check_channel_id",
    name: "Afk check channel",
    description: "The main afk check channel",
    type: "channel",
  },
  {
    key: "vet_afk_check_channel_id",
    name: "Veteran afk check channel",
    description: "The veteran afk check channel",
    type: "channel",
  },
  {
    key: "verified_role_id",
    name: "Verified raider",
    description: "The verified raider role",
    type: "role",
  },
  {
    key: "veteran_role_id",
    name: "Veteran raider",
    description: "The veteran raider role",
    type: "role",
  },
];

export default class implements Command {
  public name = "config";
  public description = "config command";
  public options = [
    {
      name: "view",
      description: "view the server config.",
      type: 1,
    },
    {
      name: "edit",
      description: "edit the server config.",
      type: 1,
    },
  ];

  public async execute(interaction: CommandInteraction) {
    const embed = await this.generateEmbed(interaction);

    if (interaction.options.getSubcommand() === "view") {
      return interaction.reply({
        embeds: [embed.setFooter("Use /config edit to edit these values.")],
      });
    }

    const rows: MessageActionRow[] = [];
    const buttons: MessageButton[] = [];

    for (let i = 0; i < Object.keys(map).length; ++i) {
      const { name, key }: { name: string; key: string } = Reflect.get(map, i);

      if (buttons.length < 5) {
        buttons.push(
          new MessageButton()
            .setStyle("PRIMARY")
            .setLabel(name)
            .setCustomId(key)
        );
      } else {
        rows.push(new MessageActionRow().addComponents(...buttons));
        for (let j = 0; j < buttons.length; ++i) buttons.pop();
      }
    }

    const message = await interaction.reply({
      embeds: [embed.setDescription(codeBlock("Select a setting to edit"))],
      components: rows,
      fetchReply: true,
    });

    const msg = message as Message;
    const collectedInteraction = await msg
      .awaitMessageComponent({
        filter: async (i) => {
          await i.deferUpdate();
          return i.user.id === interaction.user.id;
        },
        componentType: "BUTTON",
        time: 60000,
      })
      .catch(async () => {
        await interaction.editReply({
          components: [],
        });
        return undefined;
      });

    if (!collectedInteraction) return;

    const index = Object.values(map).findIndex(
      (c) => c.key === collectedInteraction.customId
    );
    const { type, description }: typeof map[0] = Reflect.get(map, index);

    const res = await prompt(
      collectedInteraction,
      [`Enter a ${type} for ${description.toLowerCase()}.`],
      []
    ).catch(() => {
      return undefined;
    });

    if (res?.[0].response) {
      await this.validateResponse(collectedInteraction, res[0].response, type);
    }
  }

  private async generateEmbed(
    interaction: CommandInteraction
  ): Promise<MessageEmbed> {
    const embed = new MessageEmbed()
      .setTitle(`${inlineCode(interaction.guild?.name as string)} config`)
      .setColor("DARK_BUT_NOT_BLACK");

    const settings = await getGuild(interaction.guildId);

    for (const key of Object.values(map).map((k) => k.key)) {
      const entry = Object.values(map).find((c) => c.key === key);
      const value = Reflect.get(settings!, key);

      const {
        name,
        description,
        type,
      }: {
        name: string;
        description: string;
        type: string;
      } = entry!;

      let value_ = "";
      if (type === "role") {
        value_ = value === "" || !value ? "not set" : roleMention(value);
      } else if (type === "category") {
        value_ =
          (await interaction.guild?.channels.fetch(value as string))?.name ??
          "not set";
      } else if (type === "channel") {
        value_ = value === "" || !value ? "not set" : channelMention(value);
      }

      embed.addField(
        name,
        stripIndents`
      ${codeBlock(description)}
      ${value_}`,
        true
      );
    }

    return embed;
  }

  // TODO: or refactor to subcommands
  private async validateResponse(
    interaction: ButtonInteraction,
    response: string,
    type: string
  ): Promise<void> {
    if (type === "role") {
      const regexp = MessageMentions.ROLES_PATTERN;

      if (regexp === null) {
      }

      // role id
      if (regexp.exec(response)) {
      }
    }
  }
}
