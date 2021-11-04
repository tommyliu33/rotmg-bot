import { Discord, Once } from "discordx";

@Discord()
export abstract class Event {
  @Once("ready")
  public execute(): void {
    console.log("[bot] :: up");
  }
}
