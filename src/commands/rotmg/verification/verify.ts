import { inlineCode } from "@discordjs/builders";
import { getPlayer, RealmEyePlayer, verify } from "@functions";
import {
  awaitingVerificationCode,
  failedAwaitingVerificationCode,
  verificationAborted,
  verification_private_profile,
} from "@util";
import { stripIndents } from "common-tags";
import { ButtonInteraction, CommandInteraction } from "discord.js";
import { ButtonComponent, Discord, Slash, SlashOption } from "discordx";
import type { Redis } from "ioredis";
import { nanoid } from "nanoid";
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

    const player = await getPlayer(ign, ["player"]);
    if (Reflect.get(player, "error")) {
      await interaction.editReply({
        embeds: [verification_private_profile()],
      });
      return;
    }

    const verificationId = nanoid(12);
    const verificationData = {
      name: ign,
      profile_url: `https://www.realmeye.com/player/${ign}`,
      code: verificationId,
    };

    await redis.set(
      `verification:${interaction.guildId}:${interaction.user.id}`,
      JSON.stringify(verificationData)
    );

    await interaction.editReply(awaitingVerificationCode(ign, verificationId));
    return;
  }

  @ButtonComponent("yes")
  private async continueVerification(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const verificationInfo = await redis.get(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );

    if (!verificationInfo) {
      await interaction.editReply({
        content: verificationAborted,
      });
      return;
    }

    const { name, code } = JSON.parse(verificationInfo!);

    const player = await getPlayer(name, ["player", "desc1", "desc2", "desc3"]);
    if (Reflect.get(player, "error")) {
      await interaction.editReply({
        content: "An error occured, try again.",
      });
      return;
    }

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
        
        If you did not get the role, please contact a staff member for support.`,
      });
    }
  }

  @ButtonComponent("no")
  private async cancelVerification(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const data = await redis.get(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );

    if (!data) {
      await interaction.editReply({
        content: stripIndents`
        It seems you have not started verification.
        Run the command again to start the process.`,
      });

      return;
    }

    await redis.del(
      `verification:${interaction.guildId}:${interaction.user.id}`
    );
    await interaction.editReply({
      content: stripIndents`Aborting.
      If you want to verify, run the command again.`,
    });
  }
}
