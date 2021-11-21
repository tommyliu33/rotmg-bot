import { Guild } from "@functions";
import type { Database } from "@lib";
import { stripIndents } from "common-tags";
import {
  CommandInteraction,
  Formatters,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { nanoid } from "nanoid";
import { container, inject, injectable } from "tsyringe";
import { kDatabase } from "../../../tokens";

@injectable()
@Discord()
@SlashGroup("config")
export class ConfigViewCommand {
  public constructor(@inject(kDatabase) public db: Database) {
    this.db = container.resolve<Database>(kDatabase);
  }

  @Slash("view")
  private async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();

    const db = container.resolve<Database>(kDatabase);
    const data = (await db.guilds.findOne({
      id: interaction.guildId,
    })) as unknown as Guild;

    const rotmgKey = nanoid();
    const modKey = nanoid();

    const rotmgButton = new MessageButton()
      .setCustomId(rotmgKey)
      .setLabel("RotMG")
      .setStyle("PRIMARY");

    const modButton = new MessageButton()
      .setCustomId(modKey)
      .setLabel("Moderation")
      .setStyle("SECONDARY");

    await interaction.editReply({
      content: "Select a category to view.",
      components: [
        new MessageActionRow().addComponents(rotmgButton, modButton),
      ],
    });

    const collected = await interaction.channel
      ?.awaitMessageComponent({
        time: 15000,
        componentType: "BUTTON",
        filter: (collected) => collected.user.id === interaction.user.id,
      })
      .catch(async () => {
        try {
          await interaction.followUp({
            content:
              "Collector timed out. Run the command again to view the server config.",
            ephemeral: true,
          });
        } catch {
          console.log("something happened");
        }
      });

    // TODO: automate config key-values
    if (collected?.customId === rotmgKey) {
      const { channels, user_roles, leader_roles, categories } = data.rotmg;

      // TODO: probably can automate this
      const body = stripIndents`
			__Channels__
				-> Setting: Afk check Value: ${
          channels.afk_check ?? "n/a"
        } (The main afk check channel)
				-> Setting: Veteran afk check ${
          channels.vet_afk_check ?? "n/a"
        } (The veteran afk check channel)

				__User Roles__
				-> Setting: Verified Value: ${
          user_roles.main ?? "n/a"
        } (The verified raider role)
				-> Setting: Veteran ${user_roles.veteran ?? "n/a"} (The veteran raider role)

				__Leader Roles__
				-> ${leader_roles ?? "n/a"}

				__Categories__
				-> Setting: Main Value: ${categories.main ?? "n/a"} (The main raiding section)
				-> Setting: Veteran Value: ${categories.veteran} (The veteran raiding section)
			`;

      await interaction.editReply({
        content: Formatters.codeBlock(body),
        components: [],
      });
    } else if (collected?.customId === modKey) {
      const { moderation } = data;

      // TODO: probably can automate this
      const body = stripIndents`
			Mod role id ${moderation.mod_role_id}

			Mod log channel id ${moderation.mod_log_channel_id}
			`;

      await interaction.editReply({
        content: Formatters.codeBlock(body),
        components: [],
      });
    }
  }
}
