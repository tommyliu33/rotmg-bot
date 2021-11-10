import { createChannel } from "@functions";
import { CommandInteraction, Formatters } from "discord.js";
import { Discord, Slash, SlashChoice, SlashOption } from "discordx";
import { dungeons } from "../../../dungeons";
import {
  getGuildSetting,
  SettingsKey,
} from "../../../functions/settings/getGuildSetting";
import { afkCheckEmbed } from "../../../util/Embeds";

@Discord()
export abstract class Command {
  @Slash("afkcheck", { description: "start an afkcheck" })
  private async execute(
    @SlashChoice("The Shatters", "shatters")
    @SlashChoice("The Void", "void")
    @SlashChoice("The Nest", "nest")
    @SlashChoice("Cultist Hideout", "cult")
    @SlashChoice("Fungal Cavern", "fungal")
    @SlashChoice("Oryx Sanctuary", "o3")
    @SlashOption("dungeon", {
      type: "STRING",
      required: true,
      description: "name of the dungeon",
    })
    name: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply();

    const dungeon = dungeons[dungeons.findIndex((d) => d.name === name)];
    if (!dungeon) {
      await interaction.editReply("dungeon unavailable");
      return;
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const vetChannelId = await getGuildSetting(
      interaction.guildId!,
      SettingsKey.VetAfkCheck
    );

    const channel = await createChannel(
      interaction.guild!,
      name,
      interaction.channelId === vetChannelId
    );

    if (!channel) {
      await interaction.reply({
        content:
          "Unable to create the voice channel because of missing permissions or there was no category associated with the lounge.",
        ephemeral: true,
      });
      return;
    }
    const embed = afkCheckEmbed(dungeon).setAuthor(
      member?.displayName!,
      member?.user.displayAvatarURL({ dynamic: true })
    );

    const boosterRole = interaction.guild?.roles.premiumSubscriberRole;
    if (boosterRole) {
      embed.description += `If you have the ${boosterRole.toString()}, react with <:nitro:888634863140339824> to get moved in.`;
    }

    embed.description += "To end the afk check as the leader, react to ❌";
    if (interaction.deferred) {
      await interaction.editReply("Created afk-check");
      let initalMsg = await interaction.channel?.send({
        content: `@here ${Formatters.inlineCode(dungeon.full_name)}`,
        embeds: [embed],
        allowedMentions: {
          parse: ["everyone"],
        },
      });

      // todo: handle reactions
      // todo: control panel
    }
  }
}
