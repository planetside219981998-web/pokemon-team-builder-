import type { Pokemon, PokemonType } from '@/data/types';
import { ALL_TYPES } from '@/data/types';
import { getDefensiveProfile, getWeaknesses, getResistances } from './typeChart';

// Score how well a candidate synergizes defensively with the existing team
export function scoreSynergy(candidate: Pokemon, teamPokemon: Pokemon[]): number {
  if (teamPokemon.length === 0) return 50; // Neutral if no team yet

  let score = 50; // Start at neutral
  const candidateWeaknesses = getWeaknesses(candidate.types);
  const candidateResistances = getResistances(candidate.types);

  for (const teammate of teamPokemon) {
    const teammateWeaknesses = getWeaknesses(teammate.types);
    const teammateResistances = getResistances(teammate.types);

    // Bonus: candidate resists teammate's weaknesses (can switch in to cover)
    for (const weakness of teammateWeaknesses) {
      if (candidateResistances.includes(weakness)) {
        score += 8;
      }
    }

    // Bonus: teammate resists candidate's weaknesses (teammate can cover candidate)
    for (const weakness of candidateWeaknesses) {
      if (teammateResistances.includes(weakness)) {
        score += 5;
      }
    }

    // Penalty: shared weaknesses
    for (const weakness of candidateWeaknesses) {
      if (teammateWeaknesses.includes(weakness)) {
        score -= 10;
      }
    }
  }

  // Check for "unprotected" weaknesses: types the candidate is weak to
  // that no teammate resists
  for (const weakness of candidateWeaknesses) {
    const someoneResists = teamPokemon.some((tm) =>
      getResistances(tm.types).includes(weakness)
    );
    if (!someoneResists) {
      score -= 3;
    }
  }

  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}

// Analyze the full team's vulnerability profile
export function analyzeTeamVulnerabilities(
  team: Pokemon[]
): { type: PokemonType; count: number }[] {
  const vulnCount = new Map<PokemonType, number>();

  for (const type of ALL_TYPES) {
    let weakCount = 0;
    for (const pokemon of team) {
      const profile = getDefensiveProfile(pokemon.types);
      if ((profile.get(type) ?? 1) > 1) weakCount++;
    }
    if (weakCount > 0) {
      vulnCount.set(type, weakCount);
    }
  }

  return Array.from(vulnCount.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
