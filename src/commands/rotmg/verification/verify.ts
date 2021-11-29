import { inlineCode, bold } from "@discordjs/builders";
import { getPlayer, RealmEyePlayer, verify } from "@functions";
import {
  awaitingVerificationCode,
  failedAwaitingVerificationCode,
} from "@util";
import { stripIndents } from "common-tags";
import { ButtonInteraction, CommandInteraction } from "discord.js";
import { ButtonComponent, Discord, Slash, SlashOption } from "discordx";
import type { Redis } from "ioredis";
import { container } from "tsyringe";
import { kRedis } from "../../../tokens";

// TODO: implement verification methods
// addalt command
// cleanup folder structure for verification
// @utils -> set default user entry / guild entry when needed
// TODO: this should be a global command??
// TODO: setup guild requirements for verification

const redis = container.resolve<Redis>(kRedis);

@Discord()
export abstract class VerifyCommand {
  @Slash("verify")
  private async execute(
    @SlashOption("ign", {
      required: true,
      type: "STRING",
      description: "Name to verify under",
    })
    ign: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (
      member?.displayName
        .split(" | ")
        .map((n) => n.toLowerCase())
        .includes(ign.toLowerCase())
    ) {
      await interaction.editReply({
        content: "You are already verified under that name.",
      });
      return;
    }

    const player = await getPlayer(ign, ["player"]);
    if ("error" in player && player.error === `${ign} could not be found!`) {
      await interaction.editReply({
        content: "Could not find your name or your profile is private. ",
      });
      return;
    }

    const verificationId = "spId9Rkg9nVi"; // nanoid(12);
    await redis.set(
      `verification:${interaction.guildId}:${interaction.user.id}`,
      JSON.stringify({
        name: ign,
        code: verificationId,
        profile_url: `https://www.realmeye.com/player/${ign}`,
      })
    );

    await interaction.editReply(awaitingVerificationCode(ign, verificationId));
    return;
  }

  @ButtonComponent("verification-continue-btn")
  private async continue(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const data = await redis.get(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );
    if (!data) {
      await interaction.editReply(stripIndents`
      Could not find your verification session or you were successfully verified.
      If you accidently cancelled the verification process, run the command again to restart.
      
      ${bold("NOTE THAT THE PREVIOUS CODE IS NOW INVALIDATED!")}
      `);
      return;
    }

    const { name, code } = JSON.parse(data);
    const player = await getPlayer(name, ["player", "desc1", "desc2", "desc3"]);
    if ("error" in player && player.error === `${name} could not be found!`) {
      await interaction.editReply({
        content: "Could not find your name or your profile is private. ",
      });
      return;
    }

    await interaction.editReply({ content: "Loading RealmEye profile..." });

    const player_ = player as RealmEyePlayer;

    if (
      !player_.desc1.includes(code) &&
      !player_.desc2.includes(code) &&
      !player_.desc3.includes(code)
    ) {
      await interaction.editReply(failedAwaitingVerificationCode(name, code));
    } else {
      await redis.del(
        `verification:${interaction.guildId}:${interaction.user.id}`
      );

      await verify(interaction.guildId, interaction.user.id, name);
      await interaction.editReply({
        content: stripIndents`You have been successfuly verified in ${inlineCode(
          interaction.guild?.name!
        )}!
        
        If you did not get the role or nickname, please contact a staff member for support.`,
      });
    }
  }

  @ButtonComponent("verification-abort-btn")
  private async abort(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const has = await redis.exists(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );

    if (!has) {
      await interaction.editReply({
        content: "Cannot do that.",
      });
      return;
    }

    await redis.del(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );
    await interaction.editReply({
      content: "Aborting.",
    });
    return;
  }
}
