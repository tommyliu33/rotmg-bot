// TODO: refactor
export interface Player {
  accountFame: number;
  accountFameRank: number;
  characters: Character[];
  charactersHidden: boolean;
  chars: number;
  desc1: string;
  desc2: string;
  desc3: string;
  donator: boolean;
  exp: number;
  expRank: number;
  fame: number;
  fameRank: number;
  guild: string;
  guildConfirmed: boolean;
  guildRank: string;
  player: string;
  playerLastSeen: string;
  rank: number;
  skins: number;
  skinsRank: number;
}

export interface Character {
  backpack: boolean;
  characterDyes: CharacterDyes;
  class: string;
  // number of class quests completed 0-5 but N/A anyways
  cqc: Cqc;
  dataClassID: number;
  dataPetID: number;
  dataSkinID: number;
  equips: Equips;
  exp: number;
  fame: number;
  lastSeen: string;
  lastServer: string;
  level: number;
  pet: Pet;
  place: number;
  stats: Stats;
  statsMaxed: number;
}

export interface CharacterDyes {
  accessoryDye: string;
  clothingDye: string;
  dataAccessoryDye: number;
  dataClothingDye: number;
}

export enum Cqc {
  NA = "N/A",
}

export interface Equips {
  ability: string;
  armor: string;
  dataAbilityID: number;
  dataArmorID: number;
  dataRingID: number;
  dataWeaponID: number;
  ring: string;
  weapon: string;
}

export enum Pet {
  Empty = "",
  YoungElk = "Young Elk",
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
