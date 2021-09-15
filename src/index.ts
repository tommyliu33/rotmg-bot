console.log("[bot] init");

import "dotenv/config";
import "module-alias/register";

import { Bot, CommandContext, Utils } from "@lib";

const client = new Bot();
client.on("ready", async () => {
  await client.init();
  await Utils.syncCommands(client);

  const guilds = await client.guilds.fetch();
  // TODO: refactor
  guilds.forEach(async (g) => {
    if (!(await client.guilds_db.get(g.id))) {
      await client.guilds_db.set(g.id, {
        verification_method: "",
        verification_channel: "",
        verified_role: "",
        afk_check_channel: "",
      });
    }
  });

  console.log("[discord] ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    client.commands
      .get(interaction.commandName)
      ?.exec(new CommandContext(interaction));
  } else if (interaction.isButton() && interaction.inGuild()) {
    // user clicks the button
    const { user } = interaction;
    // TODO:
    // verifyMember();
  }
});

client.login(process.env.bot_token);
