import { db, setMeta, clearRankings, type StoredRanking, type StoredGroup } from './db';
import { URLS } from './constants';
import type { Pokemon, Move, CupDefinition, Format, GroupEntry, RankedPokemon } from './types';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

// Fetch and store all core game data (pokemon, moves, formats, cups)
export async function fetchCoreData(): Promise<void> {
  const [pokemon, moves, formats] = await Promise.all([
    fetchJSON<Pokemon[]>(URLS.pokemon),
    fetchJSON<Move[]>(URLS.moves),
    fetchJSON<Format[]>(URLS.formats),
  ]);

  // Extract cup names from formats
  const cupNames = [...new Set(formats.map((f) => f.cup).filter(Boolean))];

  // Fetch all cup definitions in parallel
  const cupResults = await Promise.allSettled(
    cupNames.map(async (name) => {
      try {
        return await fetchJSON<CupDefinition>(URLS.cup(name));
      } catch {
        // Some cups may not have a definition file
        return null;
      }
    })
  );
  const cups = cupResults
    .filter((r): r is PromiseFulfilledResult<CupDefinition | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((c): c is CupDefinition => c !== null);

  // Store everything in a transaction
  await db.transaction('rw', [db.pokemon, db.moves, db.formats, db.cups], async () => {
    await db.pokemon.clear();
    await db.moves.clear();
    await db.formats.clear();
    await db.cups.clear();

    // Filter to released pokemon only
    const releasedPokemon = pokemon.filter((p) => p.released !== false);
    await db.pokemon.bulkPut(releasedPokemon);
    await db.moves.bulkPut(moves);
    await db.formats.bulkPut(formats);
    await db.cups.bulkPut(cups);
  });

  await setMeta('coreDataLoaded', 'true');
}

// Fetch and store rankings for a specific league/CP
export async function fetchRankings(league: string, cp: number): Promise<void> {
  const rankings = await fetchJSON<RankedPokemon[]>(URLS.rankings(league, cp));

  const storedRankings: StoredRanking[] = rankings.map((r) => ({
    ...r,
    league,
    cp,
  }));

  await clearRankings(league, cp);
  await db.rankings.bulkPut(storedRankings);
  await setMeta(`rankings_${league}_${cp}`, 'true');
}

// Fetch and store group movesets for a league
export async function fetchGroups(league: string): Promise<void> {
  try {
    const groups = await fetchJSON<GroupEntry[]>(URLS.groups(league));
    const storedGroups: StoredGroup[] = groups.map((g) => ({ ...g, league }));

    // Clear existing groups for this league
    await db.groups.where('league').equals(league).delete();
    await db.groups.bulkPut(storedGroups);
  } catch {
    // Groups file may not exist for all leagues - that's OK
  }
}

// Check if rankings are already cached for a league/CP
export async function hasRankings(league: string, cp: number): Promise<boolean> {
  const count = await db.rankings.where({ league, cp }).count();
  return count > 0;
}
