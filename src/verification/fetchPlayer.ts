import { Player } from "@lib";
import petitio from "petitio";

const base = "https://nightfirec.at/realmeye-api/?player=";

export async function fetchPlayer(name: string): Promise<Player | null> {
  console.log(`[fetching] name: ${name}`);
  const req = await petitio(`${base}${name}`).send();

  if (req.statusCode === 200) {
    const json = await req.json();

    return json as Player;
  } else {
    // something else happened
    return null;
  }
}
