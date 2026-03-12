import type { PokemonType } from '@/data/types';
import { ALL_TYPES } from '@/data/types';
import { SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE, DOUBLE_RESIST, NEUTRAL } from '@/data/constants';

const S = SUPER_EFFECTIVE;     // 1.6
const R = NOT_VERY_EFFECTIVE;  // 0.625
const I = DOUBLE_RESIST;      // 0.390625 (immunity in main games = double resist in GO)
const N = NEUTRAL;             // 1.0

// typeChart[attacking][defending] = effectiveness multiplier
// Row = attacking type, Column = defending type
// Order: normal, fire, water, electric, grass, ice, fighting, poison, ground,
//        flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy
const CHART: number[][] = [
  //         NOR  FIR  WAT  ELE  GRA  ICE  FIG  POI  GRO  FLY  PSY  BUG  ROC  GHO  DRA  DAR  STE  FAI
  /* NOR */ [N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   R,   I,   N,   N,   R,   N  ],
  /* FIR */ [N,   R,   R,   N,   S,   S,   N,   N,   N,   N,   N,   S,   R,   N,   R,   N,   S,   N  ],
  /* WAT */ [N,   S,   R,   N,   R,   N,   N,   N,   S,   N,   N,   N,   S,   N,   R,   N,   N,   N  ],
  /* ELE */ [N,   N,   S,   R,   R,   N,   N,   N,   I,   S,   N,   N,   N,   N,   R,   N,   N,   N  ],
  /* GRA */ [N,   R,   S,   N,   R,   N,   N,   R,   S,   R,   N,   R,   S,   N,   R,   N,   R,   N  ],
  /* ICE */ [N,   R,   R,   N,   S,   R,   N,   N,   S,   S,   N,   N,   N,   N,   S,   N,   R,   N  ],
  /* FIG */ [S,   N,   N,   N,   N,   S,   N,   R,   N,   R,   R,   R,   S,   I,   N,   S,   S,   R  ],
  /* POI */ [N,   N,   N,   N,   S,   N,   N,   R,   R,   N,   N,   N,   R,   R,   N,   N,   I,   S  ],
  /* GRO */ [N,   S,   N,   S,   R,   N,   N,   S,   N,   I,   N,   R,   S,   N,   N,   N,   S,   N  ],
  /* FLY */ [N,   N,   N,   R,   S,   N,   S,   N,   N,   N,   N,   S,   R,   N,   N,   N,   R,   N  ],
  /* PSY */ [N,   N,   N,   N,   N,   N,   S,   S,   N,   N,   R,   N,   N,   N,   N,   I,   R,   N  ],
  /* BUG */ [N,   R,   N,   N,   S,   N,   R,   R,   N,   R,   S,   N,   N,   R,   N,   S,   R,   R  ],
  /* ROC */ [N,   S,   N,   N,   N,   S,   R,   N,   R,   S,   N,   S,   N,   N,   N,   N,   R,   N  ],
  /* GHO */ [I,   N,   N,   N,   N,   N,   N,   N,   N,   N,   S,   N,   N,   S,   N,   R,   N,   N  ],
  /* DRA */ [N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   S,   N,   R,   I  ],
  /* DAR */ [N,   N,   N,   N,   N,   N,   R,   N,   N,   N,   S,   N,   N,   S,   N,   R,   R,   R  ],
  /* STE */ [N,   R,   R,   R,   N,   S,   N,   N,   N,   N,   N,   N,   S,   N,   N,   N,   R,   S  ],
  /* FAI */ [N,   R,   N,   N,   N,   N,   S,   R,   N,   N,   N,   N,   N,   N,   S,   S,   R,   N  ],
];

// Get type effectiveness multiplier for a single attacking type vs single defending type
export function getTypeEffectiveness(attacking: PokemonType, defending: PokemonType): number {
  if (attacking === 'none' || defending === 'none') return NEUTRAL;
  const atkIdx = ALL_TYPES.indexOf(attacking);
  const defIdx = ALL_TYPES.indexOf(defending);
  if (atkIdx === -1 || defIdx === -1) return NEUTRAL;
  return CHART[atkIdx]![defIdx]!;
}

// Get combined effectiveness for an attacking type vs a dual-typed defender
export function getEffectivenessVsDualType(
  attacking: PokemonType,
  defType1: PokemonType,
  defType2?: PokemonType
): number {
  let mult = getTypeEffectiveness(attacking, defType1);
  if (defType2 && defType2 !== 'none') {
    mult *= getTypeEffectiveness(attacking, defType2);
  }
  return mult;
}

// Get all defensive multipliers for a pokemon's typing
export function getDefensiveProfile(
  types: PokemonType[]
): Map<PokemonType, number> {
  const profile = new Map<PokemonType, number>();
  for (const atkType of ALL_TYPES) {
    let mult = 1;
    for (const defType of types) {
      mult *= getTypeEffectiveness(atkType, defType);
    }
    profile.set(atkType, mult);
  }
  return profile;
}

// Get types that a pokemon is weak to (multiplier > 1)
export function getWeaknesses(types: PokemonType[]): PokemonType[] {
  const profile = getDefensiveProfile(types);
  return ALL_TYPES.filter((t) => (profile.get(t) ?? 1) > 1);
}

// Get types that a pokemon resists (multiplier < 1)
export function getResistances(types: PokemonType[]): PokemonType[] {
  const profile = getDefensiveProfile(types);
  return ALL_TYPES.filter((t) => (profile.get(t) ?? 1) < 1);
}
