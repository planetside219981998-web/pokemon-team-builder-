import Dexie, { type EntityTable } from 'dexie';
import type { Pokemon, Move, RankedPokemon, CupDefinition, Format, GroupEntry } from './types';

// Stored ranking with league key for indexing
export interface StoredRanking extends RankedPokemon {
  league: string;
  cp: number;
  _id?: number;
}

export interface StoredGroup extends GroupEntry {
  league: string;
  _id?: number;
}

export interface MetaEntry {
  key: string;
  value: string;
}

class PokemonDB extends Dexie {
  pokemon!: EntityTable<Pokemon, 'speciesId'>;
  moves!: EntityTable<Move, 'moveId'>;
  rankings!: EntityTable<StoredRanking, '_id'>;
  cups!: EntityTable<CupDefinition, 'name'>;
  formats!: EntityTable<Format, 'cup'>;
  groups!: EntityTable<StoredGroup, '_id'>;
  meta!: EntityTable<MetaEntry, 'key'>;

  constructor() {
    super('PokemonTeamBuilder');

    this.version(1).stores({
      pokemon: 'speciesId, dex, *types, *tags',
      moves: 'moveId, type',
      rankings: '++_id, [league+cp], [league+cp+speciesId], speciesId',
      cups: 'name',
      formats: 'cup',
      groups: '++_id, [league+speciesId], league',
      meta: 'key',
    });
  }
}

export const db = new PokemonDB();

// Helper: Get or set meta values
export async function getMeta(key: string): Promise<string | undefined> {
  const entry = await db.meta.get(key);
  return entry?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

// Helper: Get rankings for a specific league/cp
export async function getRankings(league: string, cp: number): Promise<StoredRanking[]> {
  return db.rankings.where({ league, cp }).toArray();
}

// Helper: Clear rankings for a specific league/cp before re-importing
export async function clearRankings(league: string, cp: number): Promise<void> {
  await db.rankings.where({ league, cp }).delete();
}

// Helper: Check if we have data loaded
export async function hasData(): Promise<boolean> {
  const count = await db.pokemon.count();
  return count > 0;
}
