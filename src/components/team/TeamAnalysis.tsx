import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { analyzeTeamVulnerabilities } from '@/engine/synergyAnalyzer';
import { getResistances } from '@/engine/typeChart';
import { TypeBadge } from '@/components/shared/TypeBadge';
import type { PokemonType } from '@/data/types';

export function TeamAnalysis() {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const teamPokemon = useMemo(
    () => team.filter((s) => s !== null).map((s) => s.pokemon),
    [team]
  );

  const analysis = useMemo(() => {
    if (teamPokemon.length === 0) return null;

    const vulnerabilities = analyzeTeamVulnerabilities(teamPokemon);
    const critical = vulnerabilities.filter((v) => v.count >= 2);
    const warnings = vulnerabilities.filter((v) => v.count === 1);

    // Types the team covers offensively (at least one member has STAB)
    const offensiveTypes = new Set<PokemonType>();
    for (const p of teamPokemon) {
      for (const type of p.types) {
        if (type !== 'none') offensiveTypes.add(type);
      }
    }

    // Types the team resists
    const allResists = new Set<PokemonType>();
    for (const p of teamPokemon) {
      for (const r of getResistances(p.types)) {
        allResists.add(r);
      }
    }

    // Unprotected weaknesses: team is weak but nobody resists
    const unprotected: PokemonType[] = [];
    for (const v of vulnerabilities) {
      if (!allResists.has(v.type)) {
        unprotected.push(v.type);
      }
    }

    return { critical, warnings, offensiveTypes, allResists, unprotected };
  }, [teamPokemon]);

  if (!analysis || teamPokemon.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4 shadow-lg animate-slideUp">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {t('analysis.title')}
      </h2>

      {/* Critical: multiple team members weak */}
      {analysis.critical.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30">
          <div className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {t('analysis.critical')}
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.critical.map((v) => (
              <span key={v.type} className="flex items-center gap-1">
                <TypeBadge type={v.type} size="sm" />
                <span className="text-[10px] text-red-300">({v.count}x)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Unprotected weaknesses */}
      {analysis.unprotected.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <div className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t('analysis.unprotected')}
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.unprotected.map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Team resists */}
      {analysis.allResists.size > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
          <div className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('analysis.resists')}
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(analysis.allResists).map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* STAB Coverage */}
      <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
        <div className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t('analysis.stabCoverage')}
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from(analysis.offensiveTypes).map((type) => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
