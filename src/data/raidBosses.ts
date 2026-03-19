import { db } from './db';
import type { Pokemon } from './types';

interface RaidBossEntry {
  pokemon_id: number;
  pokemon_name: string;
  form?: string;
  tier: string;
}

interface RaidBossesResponse {
  current: Record<string, RaidBossEntry[]>;
}

const CACHE_KEY = 'raid_bosses_cache';
const CACHE_TTL = 3600000; // 1 hour

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
    case 'ultra_beast': return 'Ultra Beast';
    case '6': return 'Mega / Primal';
    default: return `Tier ${tier}`;
  }
}

function getTierOrder(tier: string): number {
  switch (tier) {
    case '5': return 1;
    case '6': return 2;
    case 'mega': return 3;
    case 'ultra_beast': return 4;
    case '3': return 5;
    case '1': return 6;
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
      const bosses: { pokemon: Pokemon; entry: RaidBossEntry }[] = [];

      for (const entry of entries) {
        // Try to find pokemon by dex number first, then by name
        let pokemon = pokemonByDex.get(entry.pokemon_id);
        if (!pokemon) {
          pokemon = pokemonByName.get(entry.pokemon_name.toLowerCase());
        }
        if (pokemon) {
          bosses.push({ pokemon, entry });
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
