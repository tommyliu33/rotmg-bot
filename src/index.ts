import "dotenv/config";
import "module-alias/register";

import { Bot, CommandContext, Utils, Verification } from "@lib";
import { Guild, GuildMember } from "discord.js";

const client = new Bot();
client.on("ready", async () => {
  await client.init();
  await Utils.syncCommands(client);

  const guilds = await client.guilds.fetch();
  // TODO: refactor
  guilds.forEach(async (g) => {
    if (!(await client.guilds_db.get(g.id))) {
      await client.guilds_db.set(g.id, {
        verification_channel: "",
        verified_role: "",
      });
    }
  });

  console.log("[discord] ready!");
});

// todo: refactor
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    // TODO: get options from Interaction#options instead of this
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

      const verified = await client.verification.verify_player(
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
  } else if (interaction.isButton() && interaction.inGuild()) {
    const { user } = interaction;
    // @ts-ignore
    await client.commands.get("verify")?.exec(new CommandContext(interaction));
  }
});

client.login(process.env.bot_token);
