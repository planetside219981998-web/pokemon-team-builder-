import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { useTeamBuilder } from '@/hooks/useTeamBuilder';
import { LeagueSelector } from '@/components/league/LeagueSelector';
import { TeamDisplay } from '@/components/team/TeamDisplay';
import { TeamSaveLoad } from '@/components/team/TeamSaveLoad';
import { PokemonSearch } from '@/components/search/PokemonSearch';
import { TypeCoverageGrid } from '@/components/results/TypeCoverageGrid';
import { TeamAnalysis } from '@/components/team/TeamAnalysis';
import { MetaOverview } from '@/components/results/MetaOverview';
import { RecommendationList } from '@/components/results/RecommendationList';
import { db } from '@/data/db';
import type { Pokemon } from '@/data/types';

function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-5 mb-1 animate-slideUp">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3" style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(234, 179, 8, 0.1))',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        color: '#fca5a5',
      }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        {t('hero.badge', 'PvPoke Data Powered')}
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          {t('hero.title', 'Build Your Dream Team')}
        </span>
      </h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        {t('hero.subtitle', 'Choose a league, browse the meta tier list, and build the perfect team. Our algorithm analyzes coverage, synergy, and matchups.')}
      </p>

      {/* Quick start steps */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
          }}>1</span>
          {t('hero.step1', 'Pick League')}
        </div>
        <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
          }}>2</span>
          {t('hero.step2', 'Add Pokemon')}
        </div>
        <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
          }}>3</span>
          {t('hero.step3', 'Get Picks')}
        </div>
      </div>
    </div>
  );
}

export function TeamBuilderPage() {
  const team = useAppStore((s) => s.team);
  const addToTeam = useAppStore((s) => s.addToTeam);
  const setLeague = useAppStore((s) => s.setLeague);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const loadedRef = useRef(false);

  const { recommendations, loading, error } = useTeamBuilder();

  const hasEmptySlot = team.some((s) => s === null);
  const isDataReady = syncStatus === 'ready';

  // Load team from URL params on mount
  useEffect(() => {
    if (!isDataReady || loadedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const teamParam = params.get('team');
    if (!teamParam) return;
    loadedRef.current = true;

    const league = params.get('league') ?? 'all';
    const cp = parseInt(params.get('cp') ?? '1500', 10);
    setLeague(league, cp);

    const ids = teamParam.split(',').filter(Boolean);
    db.pokemon.toArray().then((allPokemon) => {
      for (const id of ids) {
        const mon = allPokemon.find((p) => p.speciesId === id);
        if (mon) addToTeam(mon);
      }
    });

    window.history.replaceState({}, '', window.location.pathname);
  }, [isDataReady, addToTeam, setLeague]);

  const handleSelect = (pokemon: Pokemon, cp?: number) => {
    if (hasEmptySlot) {
      addToTeam(pokemon, undefined, cp);
    }
  };

  const teamCount = team.filter((s) => s !== null).length;

  return (
    <div>
      {/* Hero when empty */}
      {teamCount === 0 && <HeroSection />}

      {/* League selector - full width */}
      <LeagueSelector />

      {/* === Side-by-side: Meta (left) | Team Builder (right) === */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* LEFT COLUMN: Meta Tier List */}
        <div className="lg:w-[380px] xl:w-[420px] lg:shrink-0 order-2 lg:order-1">
          <div className="lg:sticky lg:top-[60px] lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto scrollbar-hide">
            <MetaOverview startExpanded={true} />
          </div>
        </div>

        {/* RIGHT COLUMN: Team Builder */}
        <div className="flex-1 min-w-0 space-y-5 order-1 lg:order-2">
          <TeamDisplay />
          <TeamSaveLoad />

          {/* Search */}
          {isDataReady && (
            <PokemonSearch
              onSelect={handleSelect}
              disabled={!hasEmptySlot}
            />
          )}

          {/* Analysis */}
          <TeamAnalysis />
          <TypeCoverageGrid />

          {/* Recommendations */}
          {isDataReady && (
            <RecommendationList
              recommendations={recommendations}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
