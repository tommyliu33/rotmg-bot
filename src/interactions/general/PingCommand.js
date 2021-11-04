"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const builders_1 = require("@discordjs/builders");
exports.PingCommand = new builders_1.SlashCommandBuilder()
    .setName("ping")
    .setDescription("pong.")
    .toJSON();
