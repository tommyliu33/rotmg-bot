import type { Bot } from "@lib";
import type { PrismaClient } from "@prisma/client";
import { ArgsOf, Discord, On } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kClient, kPrisma } from "../tokens";

const keys = [
  "afk_check_channel_id",
  "vet_afk_check_channel_id",
  "verified_role_id",
  "veteran_role_id",
  "log_channel_id",
  "main_section_id",
  "veteran_section_id",
];

@Discord()
@injectable()
export class Event {
  public constructor(@inject(kClient) public readonly client: Bot) {
    this.client = container.resolve<Bot>(kClient);
  }

  @On("interactionCreate")
  private async execute([interaction]: ArgsOf<"interactionCreate">) {
    if (
      interaction.type !== "APPLICATION_COMMAND" &&
      interaction.type !== "MESSAGE_COMPONENT"
    )
      return;

    const prisma = container.resolve<PrismaClient>(kPrisma);
    if (
      interaction.inGuild() &&
      !(await prisma.guilds.findFirst({
        where: {
          id_: interaction.guildId,
        },
      }))
    ) {
      await prisma.guilds.create({
        // @ts-ignore it already handles empty strings
        data: {
          ...keys.reduce((a, v) => ({ ...a, [v]: "" }), {}),
          id_: interaction.guildId,
        },
      });
    }

    await this.client.executeInteraction(interaction);
  }
}
