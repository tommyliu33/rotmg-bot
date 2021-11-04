/*import { inlineCode } from "@discordjs/builders";
import { Command } from "@lib";
import {
  CommandInteraction,
  GuildMember,
  Message,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { dungeons } from "../../../dungeons";
import { afkCheckEmbed } from "../../../util/Embeds";

export default class implements Command {
  public async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    let dungeon_name: string = interaction.options.getString("dungeon", true);

    const dungeon =
      dungeons[dungeons.findIndex((d) => d.name === dungeon_name)];

    const member = await interaction.guild?.members
      .fetch(interaction.user.id)
      .catch((err) => console.log(`[error] :: ${err.stack}`));

    const voiceChannel = await this.createVoiceChannel(member!, dungeon_name);
    if (!(voiceChannel instanceof VoiceChannel)) {
      await interaction.reply({
        content:
          "Unable to create the voice channel because of missing permissions or there was no category associated with the lounge.",
        ephemeral: true,
      });
      return;
    }

    const { afkCheckChannel } = await interaction.client.db.get(
      interaction.guildId!
    );

    let channel = await interaction.guild?.channels.fetch(afkCheckChannel)!;
    if (!channel) {
      await interaction.reply({
        content: "Could not find the afk check channel.",
        ephemeral: true,
      });
      return;
    }

    channel = channel as TextChannel;

    // update embed with raid-specific info
    const embed = afkCheckEmbed(dungeon);
    embed.description = embed.description?.replace(
      /{voiceChannel}/,
      voiceChannel.toString()
    )!;

    const boosterRole = interaction.guild?.roles.premiumSubscriberRole;
    if (boosterRole) {
      embed.description += `If you have the ${boosterRole.toString()}, react with <:nitro:888634863140339824> to get moved in.`;
    }

    embed.description += "To end the afk check as the leader, react to ❌";

    interaction.client.raids.emit("createRaid", {
      user: interaction.user.id,
      dungeon,
    });

    if (interaction.deferred) {
      let initalMsg = await interaction.editReply({
        content: `@here ${inlineCode(dungeon.full_name)} is now starting in ${
          voiceChannel.name
        }`,
        embeds: [embed],
      });

      if (!(initalMsg instanceof Message)) {
        initalMsg = await channel.messages.fetch(initalMsg.id);
      }

      // todo: handle reactions
    }
  }

  private async createVoiceChannel(
    member: GuildMember,
    name: string
  ): Promise<VoiceChannel | null> {
    const { guild } = member;
    const { mainLounge, verifiedRole, leaderRoles } =
      await member.client.db.get(guild.id);

    const lounge = await guild.channels
      .fetch(mainLounge)
      .catch((err) => console.log(`[error] :: ${err.stack}`));

    if (!lounge || !lounge.parentId) return null;

    const channel = await guild.channels.create("Raiding 1", {
      type: "GUILD_VOICE",
      permissionOverwrites: [
        {
          id: verifiedRole,
          allow: ["CONNECT", "VIEW_CHANNEL"],
          deny: ["SPEAK"],
        },
        {
          id: leaderRoles[name],
          allow: ["CONNECT", "SPEAK", "STREAM", "VIEW_CHANNEL"],
        },
        {
          id: guild.roles.everyone.id ?? guild.id,
          deny: ["VIEW_CHANNEL", "CONNECT"],
        },
      ],
      parent: lounge?.parentId!,
      position: lounge.position,
    });

    return channel;
  }
}*/