import { db } from './db';
import type { Pokemon } from './types';

// Matches the actual PoGoAPI.net response structure
interface RaidBossApiEntry {
  id: number;
  name: string;
  form?: string;
  tier: number | string;
  type: string[];
  possible_shiny?: boolean;
  boosted_weather?: string[];
  max_unboosted_cp?: number;
  max_boosted_cp?: number;
}

type RaidBossesResponse = {
  current: Record<string, RaidBossApiEntry[]>;
};

const CACHE_KEY = 'raid_bosses_cache';
const CACHE_TTL = 3600000; // 1 hour

export interface RaidBossEntry {
  id: number;
  name: string;
  form?: string;
  tier: string;
  types: string[];
  shiny: boolean;
  maxCp: number;
}

export interface RaidBossByTier {
  tier: string;
  tierLabel: string;
  bosses: { pokemon: Pokemon; entry: RaidBossEntry }[];
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case '1': return 'Tier 1';
    case '3': return 'Tier 3';
    case '5': return 'Tier 5 (Legendary)';
    case 'mega': return 'Mega Raid';
    case 'mega_legendary': return 'Mega Legendary';
    case 'ultra_beast': return 'Ultra Beast';
    case '6': return 'Primal';
    case 'ex': return 'EX Raid';
    default: return `Tier ${tier}`;
  }
}

function getTierOrder(tier: string): number {
  switch (tier) {
    case '5': return 1;
    case 'mega_legendary': return 2;
    case '6': return 3;
    case 'mega': return 4;
    case 'ultra_beast': return 5;
    case 'ex': return 6;
    case '3': return 7;
    case '1': return 8;
    default: return 10;
  }
}

export async function fetchCurrentRaidBosses(): Promise<RaidBossByTier[]> {
  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch('https://pogoapi.net/api/v1/raid_bosses.json');
    if (!res.ok) throw new Error('Failed to fetch raid bosses');
    const json: RaidBossesResponse = await res.json();

    const allPokemon = await db.pokemon.toArray();
    const pokemonByDex = new Map<number, Pokemon>();
    const pokemonByName = new Map<string, Pokemon>();
    for (const p of allPokemon) {
      pokemonByDex.set(p.dex, p);
      pokemonByName.set(p.speciesName.toLowerCase(), p);
      pokemonByName.set(p.speciesId.toLowerCase(), p);
    }

    const tiers: RaidBossByTier[] = [];

    for (const [tierKey, entries] of Object.entries(json.current ?? {})) {
      if (!entries || entries.length === 0) continue;

      const bosses: { pokemon: Pokemon; entry: RaidBossEntry }[] = [];

      for (const apiEntry of entries) {
        // Match by dex number first, then by name
        let pokemon = pokemonByDex.get(apiEntry.id);
        if (!pokemon) {
          pokemon = pokemonByName.get(apiEntry.name.toLowerCase());
        }
        if (pokemon) {
          bosses.push({
            pokemon,
            entry: {
              id: apiEntry.id,
              name: apiEntry.name,
              form: apiEntry.form,
              tier: tierKey,
              types: apiEntry.type ?? [],
              shiny: apiEntry.possible_shiny ?? false,
              maxCp: apiEntry.max_unboosted_cp ?? 0,
            },
          });
        }
      }

      if (bosses.length > 0) {
        tiers.push({
          tier: tierKey,
          tierLabel: getTierLabel(tierKey),
          bosses,
        });
      }
    }

    tiers.sort((a, b) => getTierOrder(a.tier) - getTierOrder(b.tier));

    // Cache result
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: tiers, timestamp: Date.now() }));
    } catch { /* ignore */ }

    return tiers;
  } catch (err) {
    console.warn('Could not fetch raid bosses:', err);
    return [];
  }
}
