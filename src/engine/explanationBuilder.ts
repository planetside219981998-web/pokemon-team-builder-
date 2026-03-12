import type { Pokemon, RankedPokemon, CoverageAnalysis, PokemonType, Move } from '@/data/types';
import { getResistances } from './typeChart';
import { SUPER_EFFECTIVE } from '@/data/constants';
import { getEffectivenessVsDualType } from './typeChart';

type Locale = 'en' | 'de';

const TYPE_NAMES_DE: Record<string, string> = {
  normal: 'Normal', fire: 'Feuer', water: 'Wasser', electric: 'Elektro',
  grass: 'Pflanze', ice: 'Eis', fighting: 'Kampf', poison: 'Gift',
  ground: 'Boden', flying: 'Flug', psychic: 'Psycho', bug: 'Kaefer',
  rock: 'Gestein', ghost: 'Geist', dragon: 'Drache', dark: 'Unlicht',
  steel: 'Stahl', fairy: 'Fee',
};

function typeName(type: PokemonType, locale: Locale): string {
  if (locale === 'de') return TYPE_NAMES_DE[type] ?? type;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function typeList(types: PokemonType[], locale: Locale): string {
  return types.map((t) => typeName(t, locale)).join(', ');
}

export function buildExplanation(
  candidate: Pokemon,
  ranking: RankedPokemon,
  teamPokemon: Pokemon[],
  coverage: CoverageAnalysis,
  moveMap: Map<string, Move>,
  locale: Locale
): string[] {
  const reasons: string[] = [];
  const moveset = ranking.moveset;

  // 1. Coverage contributions
  const coveredTypes: PokemonType[] = [];
  for (const uncoveredType of coverage.uncoveredTypes) {
    for (const moveId of moveset) {
      const move = moveMap.get(moveId);
      if (!move) continue;
      if (getEffectivenessVsDualType(move.type, uncoveredType) >= SUPER_EFFECTIVE) {
        coveredTypes.push(uncoveredType);
        break;
      }
    }
  }
  if (coveredTypes.length > 0) {
    if (locale === 'de') {
      reasons.push(`Deckt die fehlende Typenabdeckung gegen ${typeList(coveredTypes, locale)} ab`);
    } else {
      reasons.push(`Covers the team's gap against ${typeList(coveredTypes, locale)} types`);
    }
  }

  // 2. Resists shared weaknesses
  const resistsShared = coverage.sharedWeaknesses.filter((w) =>
    getResistances(candidate.types).includes(w)
  );
  if (resistsShared.length > 0 && teamPokemon.length > 0) {
    if (locale === 'de') {
      reasons.push(`Resistiert ${typeList(resistsShared, locale)}, was das aktuelle Team bedroht`);
    } else {
      reasons.push(`Resists ${typeList(resistsShared, locale)}, which threatens the current team`);
    }
  }

  // 3. Meta ranking
  if (ranking.score > 0) {
    if (locale === 'de') {
      reasons.push(`Meta-Ranking: Score ${ranking.score.toFixed(1)} (stark im aktuellen Meta)`);
    } else {
      reasons.push(`Meta ranking: score ${ranking.score.toFixed(1)} (strong in current meta)`);
    }
  }

  // 4. Bulk/stats
  if (ranking.stats.product > 0) {
    const bulkDesc = ranking.stats.def > ranking.stats.atk
      ? (locale === 'de' ? 'tanky' : 'bulky')
      : (locale === 'de' ? 'offensiv stark' : 'offensively strong');
    if (locale === 'de') {
      reasons.push(`Gute Stats (${bulkDesc}, Stat-Produkt: ${Math.round(ranking.stats.product)})`);
    } else {
      reasons.push(`Good stats (${bulkDesc}, stat product: ${Math.round(ranking.stats.product)})`);
    }
  }

  // 5. Accessibility
  const tags = candidate.tags ?? [];
  const isLegendary = tags.some((t) => t === 'legendary' || t === 'mythical');
  const isShadow = candidate.speciesId.includes('_shadow') || tags.includes('shadow');
  if (!isLegendary && !isShadow) {
    if (locale === 'de') {
      reasons.push('Gut erreichbar: kein Legendaeres oder Shadow-Pokemon');
    } else {
      reasons.push('Accessible: not a legendary or shadow Pokemon');
    }
  }

  return reasons;
}
