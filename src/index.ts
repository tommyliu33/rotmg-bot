console.log("[bot] init");

import "dotenv/config";
import "module-alias/register";
import "source-map-support/register";

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
  } else if (interaction.isButton() && interaction.inGuild()) {
    // user clicks the button
    const { user } = interaction;
    // TODO:
    // verifyMember();
  }
});

client.login(process.env.bot_token);
