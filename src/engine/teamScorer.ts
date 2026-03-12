import type { Pokemon, Move, RankedPokemon, Recommendation, CupDefinition } from '@/data/types';
import { SCORE_WEIGHTS } from '@/data/constants';
import { analyzeTeamCoverage, scoreCoverage } from './typeCoverage';
import { scoreSynergy } from './synergyAnalyzer';
import { filterByCup } from './cupFilter';
import { buildExplanation } from './explanationBuilder';
import { getWeaknesses } from './typeChart';

interface ScorerOptions {
  maxResults?: number;
  beginnerFriendly?: boolean;
  locale?: 'en' | 'de';
}

// Compute accessibility score for beginner-friendliness
function scoreAccessibility(pokemon: Pokemon): number {
  const tags = pokemon.tags ?? [];
  let score = 100;

  const isLegendary = tags.some((t) => t === 'legendary' || t === 'mythical');
  const isShadow = pokemon.speciesId.includes('_shadow') || tags.includes('shadow');
  const isMega = pokemon.speciesId.includes('_mega') || tags.includes('mega');

  if (isMega) score -= 50;
  if (isLegendary) score -= 40;
  if (isShadow) score -= 20;

  // XL candy check: if defaultIVs for cp1500 have level > 40, needs XL
  const ivs = pokemon.defaultIVs?.['cp1500'];
  if (ivs && ivs[0] > 40) {
    score -= 15;
  }

  return Math.max(0, score);
}

export function getRecommendations(
  teamPokemon: Pokemon[],
  rankings: RankedPokemon[],
  allPokemon: Pokemon[],
  moveMap: Map<string, Move>,
  cupDef?: CupDefinition,
  options: ScorerOptions = {}
): Recommendation[] {
  const { maxResults = 10, beginnerFriendly = true, locale = 'en' } = options;

  // Build lookup maps
  const rankingMap = new Map<string, RankedPokemon>();
  for (const r of rankings) rankingMap.set(r.speciesId, r);

  const pokemonMap = new Map<string, Pokemon>();
  for (const p of allPokemon) pokemonMap.set(p.speciesId, p);

  // Filter candidates by cup rules
  let candidates = cupDef ? filterByCup(allPokemon, cupDef) : allPokemon;

  // Remove already-selected team members
  const teamIds = new Set(teamPokemon.map((p) => p.speciesId));
  candidates = candidates.filter((p) => !teamIds.has(p.speciesId));

  // Only consider candidates that have ranking data (viable in the meta)
  candidates = candidates.filter((p) => rankingMap.has(p.speciesId));

  // Analyze current team coverage
  const coverage = analyzeTeamCoverage(teamPokemon, moveMap);

  // Find max values for normalization
  const maxScore = Math.max(...rankings.map((r) => r.score), 1);
  const maxProduct = Math.max(...rankings.map((r) => r.stats?.product ?? 0), 1);

  // Top 10 meta pokemon for matchup display
  const topMeta = rankings
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => r.speciesId);

  // Score each candidate
  const scored: Recommendation[] = [];

  for (const candidate of candidates) {
    const ranking = rankingMap.get(candidate.speciesId);
    if (!ranking) continue;

    const moveset = ranking.moveset;

    // 1. Meta score (30%)
    const metaScore = (ranking.score / maxScore) * 100;

    // 2. Coverage score (30%)
    const coverageScore = scoreCoverage(candidate, moveset, coverage, moveMap);

    // 3. Synergy score (20%)
    const synergyScore = scoreSynergy(candidate, teamPokemon);

    // 4. Bulk score (10%)
    const bulkScore = ranking.stats?.product
      ? (ranking.stats.product / maxProduct) * 100
      : 50;

    // 5. Accessibility score (10%)
    const accessibilityScore = scoreAccessibility(candidate);

    // Composite score
    const totalScore =
      metaScore * SCORE_WEIGHTS.meta +
      coverageScore * SCORE_WEIGHTS.coverage +
      synergyScore * SCORE_WEIGHTS.synergy +
      bulkScore * SCORE_WEIGHTS.bulk +
      accessibilityScore * SCORE_WEIGHTS.accessibility;

    // Generate explanation
    const reasoning = buildExplanation(
      candidate, ranking, teamPokemon, coverage, moveMap, locale
    );

    // Matchup probabilities against top meta
    const matchupProbabilities = topMeta
      .map((opId) => {
        const matchup = ranking.matchups?.find((m) => m.opponent === opId);
        const opRanking = rankingMap.get(opId);
        return {
          opponent: opId,
          opponentName: opRanking?.speciesName ?? opId,
          winRate: matchup ? matchup.rating / 1000 : 0.5,
        };
      })
      .filter((m) => m.winRate !== 0.5 || topMeta.includes(m.opponent));

    // Strengths and weaknesses as types
    const strengthTypes = candidate.types;
    const weaknessTypes = getWeaknesses(candidate.types);

    scored.push({
      pokemon: candidate,
      ranking,
      recommendedMoveset: moveset,
      score: totalScore,
      scoreBreakdown: {
        metaScore,
        coverageScore,
        synergyScore,
        bulkScore,
        accessibilityScore,
      },
      reasoning,
      matchupProbabilities,
      strengthTypes,
      weaknessTypes,
    });
  }

  // Sort by total score, descending
  scored.sort((a, b) => b.score - a.score);

  // If beginner-friendly, slightly boost accessible pokemon in the top results
  if (beginnerFriendly) {
    // Already handled by the accessibility weight in scoring
  }

  return scored.slice(0, maxResults);
}
