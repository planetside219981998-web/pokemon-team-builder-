// TypeScript interfaces matching PvPoke's actual data schemas

export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy' | 'none';

export const ALL_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

/** Filter out 'none' type for display purposes */
export function displayTypes(types: PokemonType[]): PokemonType[] {
  return types.filter((t) => t !== 'none');
}

// From gamemaster/pokemon.json
export interface Pokemon {
  dex: number;
  speciesId: string;
  speciesName: string;
  baseStats: { atk: number; def: number; hp: number };
  types: PokemonType[];
  fastMoves: string[];
  chargedMoves: string[];
  eliteMoves?: string[];
  legacyMoves?: string[];
  tags?: string[];
  defaultIVs?: Record<string, [number, number, number, number]>; // "cp1500" -> [level, atk, def, hp]
  level25CP?: number;
  buddyDistance?: number;
  thirdMoveCost?: number;
  released?: boolean;
  family?: { id: string; parent?: string; evolutions?: string[] };
}

// From gamemaster/moves.json
export interface Move {
  moveId: string;
  name: string;
  abbreviation?: string;
  type: PokemonType;
  power: number;
  energy: number;
  energyGain: number;
  cooldown: number;
  turns?: number;
  archetype?: string;
  buffs?: number[];
  buffTarget?: 'self' | 'opponent' | 'both';
  buffApplyChance?: string;
}

// From rankings/{league}/overall/rankings-{cp}.json
export interface RankedPokemon {
  speciesId: string;
  speciesName: string;
  rating: number;
  matchups: MatchupEntry[];
  counters: MatchupEntry[];
  moves: RankingMoves;
  moveset: string[];
  score: number;
  scores: number[];
  stats: { product: number; atk: number; def: number; hp: number };
}

export interface MatchupEntry {
  opponent: string;
  rating: number;
  opRating?: number;
}

export interface RankingMoves {
  fastMoves: { moveId: string; uses: number }[];
  chargedMoves: { moveId: string; uses: number }[];
}

// From gamemaster/cups/{cup}.json
export interface CupFilter {
  filterType: 'type' | 'tag' | 'dex' | 'id';
  values: (string | number)[];
}

export interface CupDefinition {
  name: string;
  title: string;
  partySize?: number;
  include: CupFilter[];
  exclude: CupFilter[];
  presetOnly?: boolean;
}

// From gamemaster/formats.json
export interface Format {
  title: string;
  cup: string;
  cp: number;
  meta: string;
  showCup?: boolean;
  showFormat?: boolean;
  showMeta?: boolean;
  hideRankings?: boolean;
}

// From groups/{league}.json
export interface GroupEntry {
  speciesId: string;
  fastMove: string;
  chargedMoves: string[];
  shadowType?: 'shadow';
}

// App-specific types

export interface TeamSlot {
  pokemon: Pokemon;
  ranking?: RankedPokemon;
  cp?: number;
}

export interface Recommendation {
  pokemon: Pokemon;
  ranking: RankedPokemon;
  recommendedMoveset: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reasoning: string[];
  matchupProbabilities: { opponent: string; opponentName: string; winRate: number }[];
  strengthTypes: PokemonType[];
  weaknessTypes: PokemonType[];
}

export interface ScoreBreakdown {
  metaScore: number;
  coverageScore: number;
  synergyScore: number;
  bulkScore: number;
  accessibilityScore: number;
}

export interface CoverageAnalysis {
  offensiveCoverage: Map<PokemonType, number>;
  defensiveWeaknesses: Map<PokemonType, number>;
  uncoveredTypes: PokemonType[];
  sharedWeaknesses: PokemonType[];
}

export interface LeagueConfig {
  id: string;
  name: string;
  cp: number;
  cup?: string;
}

export type SyncStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'offline';
