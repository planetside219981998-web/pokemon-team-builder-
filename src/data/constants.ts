const PVPOKE_BASE = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data';

export const URLS = {
  pokemon: `${PVPOKE_BASE}/gamemaster/pokemon.json`,
  moves: `${PVPOKE_BASE}/gamemaster/moves.json`,
  formats: `${PVPOKE_BASE}/gamemaster/formats.json`,
  cup: (name: string) => `${PVPOKE_BASE}/gamemaster/cups/${name}.json`,
  rankings: (league: string, cp: number) =>
    `${PVPOKE_BASE}/rankings/${league}/overall/rankings-${cp}.json`,
  groups: (league: string) => `${PVPOKE_BASE}/groups/${league}.json`,
  commitSha: 'https://api.github.com/repos/pvpoke/pvpoke/commits/master',
} as const;

export const CP_LIMITS: Record<string, number> = {
  little: 500,
  great: 1500,
  ultra: 2500,
  master: 10000,
};

export const MAIN_LEAGUES = [
  { id: 'great', name: 'Great League', cp: 1500 },
  { id: 'ultra', name: 'Ultra League', cp: 2500 },
  { id: 'master', name: 'Master League', cp: 10000 },
] as const;

// Pokemon GO type effectiveness multipliers
export const SUPER_EFFECTIVE = 1.6;
export const NOT_VERY_EFFECTIVE = 0.625;
export const DOUBLE_RESIST = 0.390625;
export const NEUTRAL = 1.0;

// Scoring weights
export const SCORE_WEIGHTS = {
  meta: 0.30,
  coverage: 0.30,
  synergy: 0.20,
  bulk: 0.10,
  accessibility: 0.10,
} as const;
