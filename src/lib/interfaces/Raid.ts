import type { Snowflake } from "discord-api-types";
import type { Dungeon } from "src/dungeons";

export interface Raid {
  user: Snowflake;
  dungeon: Dungeon;
}
