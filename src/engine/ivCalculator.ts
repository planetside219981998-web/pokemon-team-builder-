import type { Pokemon } from '@/data/types';

export interface IVResult {
  level: number;
  atk: number;
  def: number;
  hp: number;
  cp: number;
  statProduct: number;
  atkStat: number;
  defStat: number;
  hpStat: number;
  rank: number;
  percentile: number;
}

// CP Multiplier table - sourced from Pokemon GO gamemaster
// Keys are level * 2 (to avoid floating point keys)
const CPM_TABLE: number[] = [
  // index 0 = level 1, index 1 = level 1.5, etc.
  0.094, 0.13513743, 0.16639787, 0.19265092, 0.21573247, 0.23657266,
  0.25572005, 0.27353038, 0.29024988, 0.30605738, 0.3210876, 0.33544504,
  0.34921268, 0.36245775, 0.3752356, 0.38759242, 0.39956728, 0.41119355,
  0.4225, 0.43292641, 0.44310755, 0.45305996, 0.4627984, 0.47233609,
  0.48168495, 0.49085580, 0.49985844, 0.50870177, 0.51739395, 0.52594251,
  0.5343543, 0.54263574, 0.5507927, 0.55883059, 0.5667545, 0.57456913,
  0.5822789, 0.58988791, 0.5974, 0.60482367, 0.6121573, 0.61940412,
  0.6265671, 0.63364914, 0.64065295, 0.64758097, 0.65443563, 0.66121925,
  0.667934, 0.6745819, 0.6811649, 0.6876849, 0.69414365, 0.70054287,
  0.7068842, 0.71316911, 0.7193991, 0.72557561, 0.7317, 0.73474101,
  0.7377695, 0.74078559, 0.74378943, 0.74678121, 0.74976104, 0.75272909,
  0.7556855, 0.75863037, 0.76156384, 0.76448607, 0.76739717, 0.77029727,
  0.7731865, 0.7760650, 0.7789328, 0.7819001, 0.784637, 0.78737361,
  0.7903, 0.7931164, 0.7959230, 0.7987199, 0.8015073, 0.8042854,
  0.8070544, 0.8098144, 0.812566, 0.8153087, 0.81804, 0.8207554,
  0.82346, 0.8261546, 0.8288394, 0.8315142, 0.8341792, 0.8368345,
  0.83948, 0.84029999, 0.84111, 0.84191, 0.8427098,
];

function getCPM(level: number): number {
  const idx = Math.round((level - 1) * 2);
  if (idx >= 0 && idx < CPM_TABLE.length) return CPM_TABLE[idx]!;
  // Fallback for levels beyond table
  return 0.7903;
}

function calcCP(baseAtk: number, baseDef: number, baseHp: number, ivAtk: number, ivDef: number, ivHp: number, level: number): number {
  const cpm = getCPM(level);
  const atk = (baseAtk + ivAtk) * cpm;
  const def = (baseDef + ivDef) * cpm;
  const hp = Math.max(10, Math.floor((baseHp + ivHp) * cpm));
  return Math.max(10, Math.floor(atk * Math.sqrt(def) * Math.sqrt(hp) * 0.1));
}

function calcStats(baseAtk: number, baseDef: number, baseHp: number, ivAtk: number, ivDef: number, ivHp: number, level: number) {
  const cpm = getCPM(level);
  const atk = (baseAtk + ivAtk) * cpm;
  const def = (baseDef + ivDef) * cpm;
  const hp = Math.max(10, Math.floor((baseHp + ivHp) * cpm));
  return { atk, def, hp };
}

export function calculateTopIVs(pokemon: Pokemon, cpLimit: number, maxLevel: number = 51): IVResult[] {
  const { atk: baseAtk, def: baseDef, hp: baseHp } = pokemon.baseStats;
  const results: IVResult[] = [];

  for (let ivAtk = 0; ivAtk <= 15; ivAtk++) {
    for (let ivDef = 0; ivDef <= 15; ivDef++) {
      for (let ivHp = 0; ivHp <= 15; ivHp++) {
        let bestLevel = 1;
        let bestCP = 10;

        for (let lvl = 1; lvl <= maxLevel; lvl += 0.5) {
          const cp = calcCP(baseAtk, baseDef, baseHp, ivAtk, ivDef, ivHp, lvl);
          if (cp <= cpLimit) {
            bestLevel = lvl;
            bestCP = cp;
          } else {
            break;
          }
        }

        const stats = calcStats(baseAtk, baseDef, baseHp, ivAtk, ivDef, ivHp, bestLevel);
        const statProduct = stats.atk * stats.def * stats.hp;

        results.push({
          level: bestLevel,
          atk: ivAtk,
          def: ivDef,
          hp: ivHp,
          cp: bestCP,
          statProduct,
          atkStat: stats.atk,
          defStat: stats.def,
          hpStat: stats.hp,
          rank: 0,
          percentile: 0,
        });
      }
    }
  }

  results.sort((a, b) => b.statProduct - a.statProduct);

  const total = results.length;
  for (let i = 0; i < results.length; i++) {
    results[i]!.rank = i + 1;
    results[i]!.percentile = ((total - i) / total) * 100;
  }

  return results;
}

export function getIVRank(pokemon: Pokemon, cpLimit: number, ivAtk: number, ivDef: number, ivHp: number): IVResult | null {
  const results = calculateTopIVs(pokemon, cpLimit);
  return results.find((r) => r.atk === ivAtk && r.def === ivDef && r.hp === ivHp) ?? null;
}
