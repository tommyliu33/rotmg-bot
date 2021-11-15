import type { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";

export const InGuild = () => {
  const guard: GuardFunction<CommandInteraction> = async (
    interaction,
    _,
    next
  ) => {
    if (!interaction.inGuild()) {
      return;
    } else {
      await next();
    }
  };

  return guard;
};
