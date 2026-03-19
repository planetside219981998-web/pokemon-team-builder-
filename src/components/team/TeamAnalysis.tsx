import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { analyzeTeamVulnerabilities } from '@/engine/synergyAnalyzer';
import { getResistances } from '@/engine/typeChart';
import { TypeBadge } from '@/components/shared/TypeBadge';
import type { PokemonType } from '@/data/types';

function AnalysisSection({ icon, title, color, borderColor, bgColor, children }: {
  icon: React.ReactNode;
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3.5 rounded-xl" style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
    }}>
      <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

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

    const offensiveTypes = new Set<PokemonType>();
    for (const p of teamPokemon) {
      for (const type of p.types) {
        if (type !== 'none') offensiveTypes.add(type);
      }
    }

    const allResists = new Set<PokemonType>();
    for (const p of teamPokemon) {
      for (const r of getResistances(p.types)) {
        allResists.add(r);
      }
    }

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
    <div className="glass-card rounded-2xl p-4 animate-slideUp">
      <h2 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.1))',
          border: '1px solid rgba(234, 179, 8, 0.2)',
        }}>
          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        {t('analysis.title')}
      </h2>

      <div className="space-y-3">
        {/* Critical weaknesses */}
        {analysis.critical.length > 0 && (
          <AnalysisSection
            icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
            title={t('analysis.critical')}
            color="#f87171"
            borderColor="rgba(239, 68, 68, 0.2)"
            bgColor="rgba(153, 27, 27, 0.1)"
          >
            <div className="flex flex-wrap gap-1.5">
              {analysis.critical.map((v) => (
                <span key={v.type} className="flex items-center gap-1">
                  <TypeBadge type={v.type} size="sm" />
                  <span className="text-[10px] text-red-300 font-semibold">({v.count}x)</span>
                </span>
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Unprotected */}
        {analysis.unprotected.length > 0 && (
          <AnalysisSection
            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
            title={t('analysis.unprotected')}
            color="#fb923c"
            borderColor="rgba(249, 115, 22, 0.2)"
            bgColor="rgba(124, 45, 18, 0.1)"
          >
            <div className="flex flex-wrap gap-1.5">
              {analysis.unprotected.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Resists */}
        {analysis.allResists.size > 0 && (
          <AnalysisSection
            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title={t('analysis.resists')}
            color="#4ade80"
            borderColor="rgba(34, 197, 94, 0.2)"
            bgColor="rgba(20, 83, 45, 0.1)"
          >
            <div className="flex flex-wrap gap-1.5">
              {Array.from(analysis.allResists).map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* STAB Coverage */}
        <AnalysisSection
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          title={t('analysis.stabCoverage')}
          color="#60a5fa"
          borderColor="rgba(59, 130, 246, 0.2)"
          bgColor="rgba(29, 78, 216, 0.1)"
        >
          <div className="flex flex-wrap gap-1.5">
            {Array.from(analysis.offensiveTypes).map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
        </AnalysisSection>
      </div>
    </div>
  );
}
