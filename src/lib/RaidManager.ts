import { TypedEmitter } from "tiny-typed-emitter";
import { Bot } from "@lib";
import type { Raid } from "@interfaces";

export interface RaidEvents {
  createRaid: (raid: Raid) => void;
}

export class RaidManager extends TypedEmitter<RaidEvents> {
  public client: Bot;
  public constructor(client: Bot) {
    super();
    this.client = client;

    this.createRaid();
  }

  private createRaid() {
    this.on("createRaid", (raid) => {
      console.log("raid", raid);
    });
  }
}
