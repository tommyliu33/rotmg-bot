/*import { Interaction } from "discord.js";
import { Discord, On } from "discordx";

@Discord()
export abstract class Event {
  @On("interactionCreate")
  public async execute(interaction: Interaction): Promise<void> {
    
    if (!interaction.isCommand()) return;

    await interaction.client.commands
      .get(interaction.commandName)
      ?.execute(interaction);
    console.log(
      `[interaction_create] :: ${interaction.user.tag} "${interaction.commandName}"`
    );
  }
}*/
