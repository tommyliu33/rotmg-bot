import type { Interaction } from "discord.js";
import type { Command, Event } from "@struct";

import { inject, injectable } from "tsyringe";
import { logger } from "../logger";
import { kCommands } from "../tokens";

@injectable()
export default class implements Event {
  public name = "interactionCreate";

  public constructor(
    @inject(kCommands) public readonly commands: Map<string, Command>
  ) {}

  public execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const command = this.commands.get(commandName);

    if (command) {
      try {
        void command.execute(interaction);

        logger.info(
          `${interaction.user.tag} (${interaction.user.id}) ran an command: ${commandName}`
        );
      } catch (e) {
        const err = e as Error;
        logger.error(err.stack ?? err.message);
      }
    }
  }
}
