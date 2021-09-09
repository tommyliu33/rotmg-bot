import { Player } from "@lib";
import fetch from "petitio";

const base = "https://nightfirec.at/realmeye-api/";

export async function fetchPlayer(name: string): Promise<Player | null> {
  const req = await fetch(`${base}?=${name}`).send();

  if (req.statusCode === 200) {
    const json = await req.json();

    return json as Player;
  } else {
    // something else happened
    return null;
  }
}
