import "dotenv/config";
import "module-alias/register";

import { Bot, CommandContext, Utils, Verification } from "@lib";
import { Guild, GuildMember } from "discord.js";

const client = new Bot();
client.on("ready", async () => {
  await client.init();
  await Utils.syncCommands(client);

  console.log("[discord] ready!");
});

// todo: refactor
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const options = Object.assign(
      {},
      ...interaction.options.data.map((i) => ({ [i.name]: i.value }))
    );
    client.commands
      .get(interaction.commandName)
      ?.exec(new CommandContext(interaction), options);
  } else if (interaction.isSelectMenu() && interaction.inGuild()) {
    if (interaction.customId === "select-ign-to-verify") {
      const guild_member = await interaction.guild?.members.fetch(
        interaction.user.id
      );
      if (guild_member?.pending) {
        await interaction.editReply(
          "You cannot verify until you complete the server's membership screening."
        );
      }
      const name = interaction.values[0];

      await interaction.deferReply();
      await interaction.editReply(
        `Attempting to verifying you as \`${name}\`.`
      );

      const verified = await Verification.verify_player(
        interaction.member as GuildMember,
        interaction.guild as Guild,
        interaction.values[0]
      );
      if (verified) {
        await interaction.editReply(
          `You have been successfully verified in \`${interaction.guild?.name}\`!`
        );
      }
    }
  }
});

client.login(process.env.bot_token);
