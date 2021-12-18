import type { CommandInteraction, GuildMember } from "discord.js";
import { Command } from "@struct";

import { inlineCode } from "@discordjs/builders";

export default class implements Command {
  public name = "suspend";
  public description = "suspends a user.";

  public options = [
    {
      name: "user",
      description: "user to suspend.",
      type: 6,
      required: true,
    },
    {
      name: "duration",
      description: "duration of the suspension (ex: 3d)",
      type: 3,
      required: true,
    },
    {
      name: "reason",
      description: "reason for the suspension",
      type: 3,
      required: false,
    },
  ];

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { guild } = interaction;

    const user = interaction.options.getUser("user", true);
    const target = await guild?.members.fetch(user.id).catch(() => {
      return undefined;
    });

    if (!target) {
      await interaction.editReply({
        content: `${inlineCode(user.tag)} is not in the server.`,
      });
      return;
    }

    if (user.bot) {
      await interaction.editReply({ content: "Cannot suspend a bot. " });
      return;
    }

    const member = await guild?.members.fetch(interaction.user.id).catch(() => {
      return undefined;
    });
    if (!member) return;

    if (
      guild?.ownerId !== member.user.id &&
      member.roles.highest.position <= target.roles.highest.position
    ) {
      await interaction.editReply({ content: "Cannot do that." });
      return;
    }

    if (guild?.me.roles.highest.position <= target.roles.highest.position) {
      await interaction.editReply({ content: "I cannot do that. " });
      return;
    }

    const duration = interaction.options.getString("duration", true);
    const reason =
      interaction.options.getString("reason", false) ?? "no reason provided";

    await interaction.editReply({ content: `hello <@${user.id}>` });

    const logChannelId = "";
    guild?.channels.cache.get(logChannelId).send({
      content: `suspending ${user.id} for ${reason} by ${interaction.user.tag}`,
    });
  }
}
