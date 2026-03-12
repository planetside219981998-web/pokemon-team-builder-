import type { Pokemon, Move, PokemonType } from '@/data/types';
import { getEffectivenessVsDualType } from './typeChart';

// Weather boost types
const WEATHER_BOOST: Record<string, PokemonType[]> = {
  sunny: ['fire', 'grass', 'ground'],
  rainy: ['water', 'electric', 'bug'],
  partlyCloudy: ['normal', 'rock'],
  cloudy: ['fairy', 'fighting', 'poison'],
  windy: ['dragon', 'flying', 'psychic'],
  snow: ['ice', 'steel'],
  fog: ['dark', 'ghost'],
};

// Friend boost multipliers
const FRIEND_BOOST: Record<string, number> = {
  none: 1.0,
  good: 1.03,
  great: 1.05,
  ultra: 1.07,
  best: 1.10,
};

export interface RaidCounter {
  pokemon: Pokemon;
  fastMove: Move;
  chargedMove: Move;
  dps: number;
  tdo: number;
  dpsTimesTdo: number;
  effectivenessMultiplier: number;
  weatherBoosted: boolean;
}

// Calculate CP from stats (simplified for raid context)
function estimateHP(pokemon: Pokemon, _level: number): number {
  // Use base HP + 15 IV as approximation for raid attackers (level 40)
  return Math.floor((pokemon.baseStats.hp + 15) * 0.7903); // CPM for level 40
}

function estimateAtk(pokemon: Pokemon): number {
  return (pokemon.baseStats.atk + 15) * 0.7903;
}

function estimateDef(pokemon: Pokemon): number {
  return (pokemon.baseStats.def + 15) * 0.7903;
}

// Calculate DPS for a fast + charged move combo against a boss
function calculateDPS(
  pokemon: Pokemon,
  fast: Move,
  charged: Move,
  bossTypes: PokemonType[],
  weather: string,
  friendBoost: string
): { dps: number; tdo: number } {
  const atk = estimateAtk(pokemon);
  const def = estimateDef(pokemon);
  const hp = estimateHP(pokemon, 40);

  // STAB
  const fastSTAB = pokemon.types.includes(fast.type) ? 1.2 : 1.0;
  const chargedSTAB = pokemon.types.includes(charged.type) ? 1.2 : 1.0;

  // Type effectiveness vs boss
  const fastEff = getEffectivenessVsDualType(fast.type, bossTypes[0]!, bossTypes[1]);
  const chargedEff = getEffectivenessVsDualType(charged.type, bossTypes[0]!, bossTypes[1]);

  // Weather boost (1.2x to move damage if type is boosted)
  const weatherTypes = WEATHER_BOOST[weather] ?? [];
  const fastWeather = weatherTypes.includes(fast.type) ? 1.2 : 1.0;
  const chargedWeather = weatherTypes.includes(charged.type) ? 1.2 : 1.0;

  // Friend boost
  const fBoost = FRIEND_BOOST[friendBoost] ?? 1.0;

  // Fast move DPS
  const fastDuration = (fast.cooldown || 500) / 1000; // ms to seconds
  const fastDamage = Math.floor(0.5 * fast.power * (atk / 200) * fastSTAB * fastEff * fastWeather * fBoost) + 1;
  const fastEPS = (fast.energyGain || 0) / fastDuration;

  // Charged move
  const chargedDuration = (charged.cooldown || 3000) / 1000;
  const chargedEnergy = charged.energy || 50;
  const chargedDamage = Math.floor(0.5 * charged.power * (atk / 200) * chargedSTAB * chargedEff * chargedWeather * fBoost) + 1;

  // Weave DPS: time to earn enough energy for one charged move, then fire it
  const timeToCharge = chargedEnergy / fastEPS;
  const cycleDuration = timeToCharge + chargedDuration;
  const fastMovesInCycle = Math.ceil(timeToCharge / fastDuration);
  const cycleDamage = (fastMovesInCycle * fastDamage) + chargedDamage;
  const dps = cycleDamage / cycleDuration;

  // TDO: Total Damage Output = DPS * time alive
  // Simplified: assume boss does ~900 damage per second / defense
  const bossAttack = 250; // rough average for T5 boss
  const bossDPS = (bossAttack / def) * 5; // simplified incoming DPS
  const timeAlive = hp / bossDPS;
  const tdo = dps * timeAlive;

  return { dps, tdo };
}

// Find best raid counters for a given boss
export function getRaidCounters(
  bossTypes: PokemonType[],
  allPokemon: Pokemon[],
  allMoves: Move[],
  weather: string = 'noWeather',
  friendBoost: string = 'none',
  maxResults: number = 20
): RaidCounter[] {
  const moveMap = new Map<string, Move>();
  for (const m of allMoves) moveMap.set(m.moveId, m);

  const weatherTypes = WEATHER_BOOST[weather] ?? [];
  const results: RaidCounter[] = [];

  for (const pokemon of allPokemon) {
    // Skip unreleased
    if (pokemon.released === false) continue;

    // Try all fast + charged move combinations
    let bestCombo: RaidCounter | null = null;
    let bestDpsTimesTdo = 0;

    for (const fastId of pokemon.fastMoves) {
      const fast = moveMap.get(fastId);
      if (!fast) continue;

      for (const chargedId of pokemon.chargedMoves) {
        const charged = moveMap.get(chargedId);
        if (!charged || charged.energyGain > 0) continue; // skip fast moves in charged slot

        const { dps, tdo } = calculateDPS(pokemon, fast, charged, bossTypes, weather, friendBoost);
        const dpsTimesTdo = dps * tdo;

        if (dpsTimesTdo > bestDpsTimesTdo) {
          const eff = getEffectivenessVsDualType(charged.type, bossTypes[0]!, bossTypes[1]);
          bestDpsTimesTdo = dpsTimesTdo;
          bestCombo = {
            pokemon,
            fastMove: fast,
            chargedMove: charged,
            dps,
            tdo,
            dpsTimesTdo,
            effectivenessMultiplier: eff,
            weatherBoosted: weatherTypes.includes(fast.type) || weatherTypes.includes(charged.type),
          };
        }
      }
    }

    if (bestCombo) {
      results.push(bestCombo);
    }
  }

  // Sort by DPS * TDO
  results.sort((a, b) => b.dpsTimesTdo - a.dpsTimesTdo);

  return results.slice(0, maxResults);
}
