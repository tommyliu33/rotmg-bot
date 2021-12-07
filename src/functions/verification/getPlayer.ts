import fetch from "petitio";

const API = "https://nightfirec.at/realmeye-api/";

export interface RealmEyePlayer {
  account_fame: number;
  account_fame_rank: number;
  characters: Character[];
  characters_hidden: boolean;
  chars: number;
  desc1: string;
  desc2: string;
  desc3: string;
  donator: boolean;
  exp: number;
  exp_rank: number;
  fame: number;
  fame_rank: number;
  guild: string;
  guild_confirmed: boolean;
  guild_rank: string;
  player: string;
  player_last_seen: string;
  rank: number;
  skins: number;
  skins_rank: number;
}

export interface Character {
  backpack: boolean;
  character_dyes: CharacterDyes;
  class: string;
  cqc: string;
  data_class_id: number;
  data_pet_id: number;
  data_skin_id: number;
  equips: Equips;
  exp: number;
  fame: number;
  last_seen: string;
  last_server: string;
  level: number;
  pet: string;
  place: number;
  stats: Stats;
  stats_maxed: number;
}

export interface CharacterDyes {
  accessory_dye: string;
  clothing_dye: string;
  data_accessory_dye: number;
  data_clothing_dye: number;
}

export interface Equips {
  ability: string;
  armor: string;
  data_ability_id: number;
  data_armor_id: number;
  data_ring_id: number;
  data_weapon_id: number;
  ring: string;
  weapon: string;
}

export interface Stats {
  attack: number;
  defense: number;
  dexterity: number;
  hp: number;
  mp: number;
  speed: number;
  vitality: number;
  wisdom: number;
}

type FilterChoices =
  | "player"
  | "donator"
  | "chars"
  | "skins"
  | "skins_rank"
  | "fame"
  | "fame_rank"
  | "exp"
  | "exp_rank"
  | "rank"
  | "account_fame"
  | "account_fame_rank"
  | "guild"
  | "guild_confirmed"
  | "guild_rank"
  | "created"
  | "player_last_seen"
  | "desc1"
  | "desc2"
  | "desc3"
  | "characters"
  | "characters_hidden";

export async function getPlayer(
  name: string,
  filter?: FilterChoices[]
): Promise<RealmEyePlayer | { error: string }> {
  const url = new URL(API);
  url.searchParams.append("player", name);

  let url_ = url.toString();
  if (filter) {
    // hacky
    url_ += `&filter=${filter.join("+")}`;
  }

  const req = await fetch(url_.toString(), "GET").send();

  const json = await req.json();
  if ("error" in json && json.error === `${name} could not be found!`) {
    return json;
  }
  const json_ = json as RealmEyePlayer;
  return json_;
}
