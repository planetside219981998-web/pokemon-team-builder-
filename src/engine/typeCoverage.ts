import type { Pokemon, Move, PokemonType, CoverageAnalysis } from '@/data/types';
import { ALL_TYPES } from '@/data/types';
import { SUPER_EFFECTIVE } from '@/data/constants';
import { getEffectivenessVsDualType, getDefensiveProfile } from './typeChart';

// Analyze the type coverage of the current team
export function analyzeTeamCoverage(
  teamPokemon: Pokemon[],
  moveMap: Map<string, Move>
): CoverageAnalysis {
  const offensiveCoverage = new Map<PokemonType, number>();
  const defensiveWeaknesses = new Map<PokemonType, number>();

  // Calculate offensive coverage: for each defending type, what's the best multiplier we can deal?
  for (const defType of ALL_TYPES) {
    let bestMult = 0;
    for (const pokemon of teamPokemon) {
      // Check all available moves for this pokemon
      const allMoves = [...pokemon.fastMoves, ...pokemon.chargedMoves];
      for (const moveId of allMoves) {
        const move = moveMap.get(moveId);
        if (!move) continue;
        const mult = getEffectivenessVsDualType(move.type, defType);
        if (mult > bestMult) bestMult = mult;
      }
    }
    offensiveCoverage.set(defType, bestMult);
  }

  // Calculate defensive weaknesses: for each attacking type, what's the worst multiplier we take?
  for (const atkType of ALL_TYPES) {
    let worstMult = 0;
    for (const pokemon of teamPokemon) {
      const mult = getEffectivenessVsDualType(atkType, pokemon.types[0]!, pokemon.types[1]);
      if (mult > worstMult) worstMult = mult;
    }
    defensiveWeaknesses.set(atkType, worstMult);
  }

  // Types we have no super-effective coverage against
  const uncoveredTypes = ALL_TYPES.filter(
    (t) => (offensiveCoverage.get(t) ?? 0) < SUPER_EFFECTIVE
  );

  // Types that ALL current team members are weak to
  const sharedWeaknesses = ALL_TYPES.filter((t) =>
    teamPokemon.every((pokemon) => {
      const mult = getEffectivenessVsDualType(t, pokemon.types[0]!, pokemon.types[1]);
      return mult > 1;
    })
  );

  return {
    offensiveCoverage,
    defensiveWeaknesses,
    uncoveredTypes,
    sharedWeaknesses,
  };
}

// Score how well a candidate pokemon fills the coverage gaps
export function scoreCoverage(
  candidate: Pokemon,
  candidateMoves: string[],
  coverage: CoverageAnalysis,
  moveMap: Map<string, Move>
): number {
  let score = 0;
  const maxPoints = 100;

  // Points for covering uncovered types offensively
  for (const uncoveredType of coverage.uncoveredTypes) {
    for (const moveId of candidateMoves) {
      const move = moveMap.get(moveId);
      if (!move) continue;
      if (getEffectivenessVsDualType(move.type, uncoveredType) >= SUPER_EFFECTIVE) {
        score += 15;
        break; // Only count once per type
      }
    }
  }

  // Points for resisting shared weaknesses
  const defProfile = getDefensiveProfile(candidate.types);
  for (const sharedWeak of coverage.sharedWeaknesses) {
    const mult = defProfile.get(sharedWeak) ?? 1;
    if (mult < 1) {
      score += 10; // Resists the shared weakness
    } else if (mult > 1) {
      score -= 10; // Also weak to it - bad!
    }
  }

  // Normalize to 0-100
  return Math.max(0, Math.min(maxPoints, score));
}
