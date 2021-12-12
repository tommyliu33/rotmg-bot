import type { Command, Bot } from "@struct";
import type { CommandInteraction, Interaction } from "discord.js";

import { getPlayer, verify } from "@functions";
import { nanoid } from "nanoid";
import { awaitComponent, profileUrl } from "@util";
import { MessageActionRow, MessageButton } from "discord.js"; // eslint-disable-line no-duplicate-imports
import { stripIndents } from "common-tags";
import { Embed, hyperlink, codeBlock } from "@discordjs/builders";

import { inject, injectable } from "tsyringe";
import { kRedis, kClient } from "../../tokens";
import type { Redis } from "ioredis";

@injectable()
export default class implements Command {
  public name = "verify";
  public description = "verify yourself in the server.";

  public options = [
    {
      name: "ign",
      description: "name of account to verify",
      type: 3,
      required: true,
    },
  ];

  public constructor(
    @inject(kRedis) public readonly redis: Redis,
    @inject(kClient) public readonly client: Bot
  ) {
    this.client.on("interactionCreate", this.onInteractionCreate.bind(this));
  }

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString("ign", true);

    const member = interaction.guild?.members.cache.get(interaction.user.id);

    // TODO: better name checking
    const nickname = member?.displayName;
    if (
      nickname
        ?.split(" | ")
        .map((n) => n.toLowerCase())
        .includes(name.toLowerCase())
    ) {
      await interaction.editReply({
        content: `You are already verified as ${name}.`,
      });
      return;
    }

    const res = await getPlayer(name, ["player"]);
    if (
      "error" in res &&
      (res.error === `${name} could not be found!` ||
        res.error === "Invalid player name")
    ) {
      await interaction.editReply({
        content: "Could not find your account or your profile was private.",
      });
      return;
    }

    // const code = "spId9Rkg9nVi"; // nanoid(12);
    const code = nanoid(13);

    const yesKey = nanoid();
    const noKey = nanoid();

    const yesButton = new MessageButton()
      .setCustomId(yesKey)
      .setLabel("Done")
      .setStyle("PRIMARY");

    const noButton = new MessageButton()
      .setCustomId(noKey)
      .setLabel("Cancel")
      .setStyle("DANGER");

    const embed = new Embed()
      .setDescription(
        stripIndents`
    Add the code to any line of your ${hyperlink(
      "Realmeye description",
      profileUrl(name)
    )}: ${codeBlock("fix", code)}`
      )
      .setFooter({
        text: "You may need to wait for the api to catch updates. (1-2minutes)",
      });

    await this.redis.set(
      `verification:${yesKey}`,
      JSON.stringify({
        name,
        code,
        profile_url: `https://www.realmeye.com/player/${name}`,

        yesButton,
        noButton,
        embed,
      })
    );

    const m = await interaction.editReply({
      content: " ",
      embeds: [embed],
      components: [new MessageActionRow().addComponents(yesButton, noButton)],
    });

    const collectedInteraction = await awaitComponent(interaction.client, m, {
      filter: (collected) => collected.user.id === interaction.user.id,
      componentType: "BUTTON",
      time: 1.8e6, // 30 minutes
    }).catch(async () => {
      await interaction.editReply({
        components: [],
      });
      return undefined;
    });

    if (collectedInteraction?.customId === yesKey) {
      const player = await getPlayer(name, [
        "player",
        "desc1",
        "desc2",
        "desc3",
      ]);

      if ("error" in player) {
        await collectedInteraction.editReply({
          content: "An error occured while loading your profile. ",
        });
        return;
      }

      const description = player.desc1 + player.desc2 + player.desc3; // eslint-disable-line @typescript-eslint/restrict-plus-operands
      if (!description.includes(code)) {
        await collectedInteraction.editReply({
          embeds: [
            new Embed()
              .setDescription(
                `Code not found in description.\n\n${
                  embed.description as string
                }`
              )
              .setFooter({
                text: "If this issue persists, contact a staff member.",
              }),
          ],
          components: [
            new MessageActionRow().addComponents(yesButton, noButton),
          ],
        });
        return;
      }

      await interaction.editReply({
        components: [],
      });
      await collectedInteraction.editReply({
        content: "You are now verified!",
        components: [],
        embeds: [],
      });
      await verify(interaction.guildId, interaction.user.id, name);
    } else if (collectedInteraction?.customId === noKey) {
      await this.redis.del(`verification:${yesKey}`);

      await interaction.editReply({
        components: [],
      });

      await collectedInteraction.editReply({
        content: "You have cancelled the verification process.",
      });
    }
  }

  // Used to handle interactions after first attempt
  private async onInteractionCreate(interaction: Interaction) {
    if (interaction.isButton()) {
      await interaction.deferReply({ ephemeral: true });

      const session = await this.redis.get(
        `verification:${interaction.customId}`
      );
      if (!session) return;

      const {
        name,
        code,
        embed,
        yesButton,
        noButton,
      }: {
        name: string;
        code: string;
        yesButton: MessageButton;
        noButton: MessageButton;
        embed: Embed;
      } = JSON.parse(session);

      const player = await getPlayer(name, [
        "player",
        "desc1",
        "desc2",
        "desc3",
      ]);
      if ("error" in player) return;

      const description = player.desc1 + player.desc2 + player.desc3; // eslint-disable-line @typescript-eslint/restrict-plus-operands
      if (!description.includes(code)) {
        await interaction.editReply({
          embeds: [
            new Embed(embed)
              .setDescription(
                `Code not found in description.\n\n${
                  embed.description as string
                }`
              )
              .setFooter({
                text: "If this issue persists, contact a staff member.",
              }),
          ],
          components: [
            new MessageActionRow().addComponents(yesButton, noButton),
          ],
        });
        return;
      }

      await verify(interaction.guildId, interaction.user.id, name);
      await interaction.editReply({
        content: "You are now verified!",
        components: [],
        embeds: [],
      });
    }
  }
}
