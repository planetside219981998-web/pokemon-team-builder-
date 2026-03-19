import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db } from '@/data/db';
import { analyzeTeamCoverage } from '@/engine';
import { ALL_TYPES } from '@/data/types';
import type { Move } from '@/data/types';
import { SUPER_EFFECTIVE } from '@/data/constants';
import { TYPE_HEX } from '@/data/typeColors';

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
    <div className="mb-4 glass-card rounded-2xl p-4">
      <h2 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        {t('coverage.title')}
      </h2>

      {/* Offensive coverage */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 mb-2">{t('coverage.offensive')}</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
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
                  className="rounded-xl p-1.5 text-center text-[10px] font-medium transition-all"
                  style={{
                    border: isCovered ? `2px solid rgba(34, 197, 94, 0.4)` : '2px solid rgba(71, 85, 105, 0.3)',
                    background: isCovered ? 'rgba(20, 83, 45, 0.15)' : 'rgba(51, 65, 85, 0.2)',
                    opacity: isCovered ? 1 : 0.5,
                  }}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-1"
                    style={{ backgroundColor: TYPE_HEX[type] }}
                  />
                  <span className="text-[9px] leading-none text-slate-300">
                    {t(`types.${type}`).slice(0, 3)}
                  </span>
                </div>
                {isCovered && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/50">
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Defensive weaknesses */}
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-400 mb-2">{t('coverage.defensive')}</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
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
                  className="rounded-xl p-1.5 text-center text-[10px] font-medium transition-all"
                  style={{
                    border: isSharedWeak ? '2px solid rgba(239, 68, 68, 0.5)'
                      : isWeak ? '2px solid rgba(249, 115, 22, 0.35)'
                      : isResist ? '2px solid rgba(34, 197, 94, 0.3)'
                      : '2px solid rgba(71, 85, 105, 0.3)',
                    background: isSharedWeak ? 'rgba(153, 27, 27, 0.15)'
                      : isWeak ? 'rgba(124, 45, 18, 0.1)'
                      : isResist ? 'rgba(20, 83, 45, 0.1)'
                      : 'rgba(51, 65, 85, 0.2)',
                    opacity: (isWeak || isResist || isSharedWeak) ? 1 : 0.4,
                  }}
                >
                  <div
                    className="w-full h-1.5 rounded-full mb-1"
                    style={{ backgroundColor: TYPE_HEX[type] }}
                  />
                  <span className="text-[9px] leading-none text-slate-300">
                    {t(`types.${type}`).slice(0, 3)}
                  </span>
                </div>
                {isSharedWeak && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center shadow-sm shadow-red-500/50">
                    <span className="text-[8px] text-white font-bold">!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700/30">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {t('coverage.covered')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {t('coverage.weak')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {t('coverage.sharedWeakness')}
        </span>
      </div>
    </div>
  );
}
