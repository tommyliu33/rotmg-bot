import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import {
  // rotmg
  AfkCheckCommand,
  // rotmg general
  ConfigCommand,
  // general
  PingCommand,
} from "./interactions";

const token = process.env["DISCORD_TOKEN"]!;
const rest = new REST({ version: "9" }).setToken(token);

const APPLICATION_ID = Buffer.from(token.split(".")[0], "base64").toString();

const GUILD_ID = process.env["GUILD_ID"]!;

async function deploy() {
  try {
    await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), {
      body: [
        //general
        PingCommand,

        // rotmg general
        ConfigCommand,

        // rotmg
        AfkCheckCommand,
      ],
    });

    console.log("[application commands] :: registered");
  } catch (e) {
    const err = e as Error;
    console.log(`[application commands] :: ${err.stack}`);
  }
}

deploy();
