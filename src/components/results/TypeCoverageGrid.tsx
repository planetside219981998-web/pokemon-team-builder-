import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db } from '@/data/db';
import { analyzeTeamCoverage } from '@/engine';
import { ALL_TYPES } from '@/data/types';
import type { PokemonType, Move } from '@/data/types';
import { SUPER_EFFECTIVE } from '@/data/constants';

const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD',
};

export function TypeCoverageGrid() {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const [moveMap, setMoveMap] = useState<Map<string, Move>>(new Map());

  useEffect(() => {
    db.moves.toArray().then((moves) => {
      const map = new Map<string, Move>();
      for (const m of moves) map.set(m.moveId, m);
      setMoveMap(map);
    });
  }, []);

  const teamPokemon = useMemo(
    () => team.filter((s) => s !== null).map((s) => s.pokemon),
    [team]
  );

  const coverage = useMemo(() => {
    if (teamPokemon.length === 0 || moveMap.size === 0) return null;
    return analyzeTeamCoverage(teamPokemon, moveMap);
  }, [teamPokemon, moveMap]);

  if (!coverage || teamPokemon.length === 0) return null;

  return (
    <div className="mb-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h2 className="text-sm font-medium text-slate-400 mb-3">{t('coverage.title')}</h2>

      {/* Offensive coverage */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-slate-500 mb-2">{t('coverage.offensive')}</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
          {ALL_TYPES.map((type) => {
            const mult = coverage.offensiveCoverage.get(type) ?? 0;
            const isCovered = mult >= SUPER_EFFECTIVE;
            return (
              <div
                key={type}
                className="relative group"
                title={`${t(`types.${type}`)}: ${mult.toFixed(2)}x`}
              >
                <div
                  className={`rounded-lg p-1 text-center text-[10px] font-medium border-2 transition-all ${
                    isCovered
                      ? 'border-green-500/50 bg-green-900/30'
                      : 'border-slate-600 bg-slate-700/50 opacity-60'
                  }`}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-1"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span className="text-[9px] leading-none">
                    {t(`types.${type}`).slice(0, 3)}
                  </span>
                </div>
                {isCovered && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Defensive weaknesses */}
      <div className="mb-3">
        <h3 className="text-xs font-medium text-slate-500 mb-2">{t('coverage.defensive')}</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
          {ALL_TYPES.map((type) => {
            const mult = coverage.defensiveWeaknesses.get(type) ?? 1;
            const isWeak = mult > 1;
            const isResist = mult < 1;
            const isSharedWeak = coverage.sharedWeaknesses.includes(type);
            return (
              <div
                key={type}
                className="relative group"
                title={`${t(`types.${type}`)}: ${mult.toFixed(2)}x`}
              >
                <div
                  className={`rounded-lg p-1 text-center text-[10px] font-medium border-2 transition-all ${
                    isSharedWeak
                      ? 'border-red-500 bg-red-900/40'
                      : isWeak
                        ? 'border-orange-500/50 bg-orange-900/20'
                        : isResist
                          ? 'border-green-500/50 bg-green-900/20'
                          : 'border-slate-600 bg-slate-700/50 opacity-50'
                  }`}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-1"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span className="text-[9px] leading-none">
                    {t(`types.${type}`).slice(0, 3)}
                  </span>
                </div>
                {isSharedWeak && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> {t('coverage.covered')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> {t('coverage.weak')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> {t('coverage.sharedWeakness')}
        </span>
      </div>
    </div>
  );
}
