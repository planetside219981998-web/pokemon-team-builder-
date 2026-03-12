import { useEffect, useRef } from 'react';
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

    // Clean URL without reload
    window.history.replaceState({}, '', window.location.pathname);
  }, [isDataReady, addToTeam, setLeague]);

  const handleSelect = (pokemon: Pokemon, cp?: number) => {
    if (hasEmptySlot) {
      addToTeam(pokemon, undefined, cp);
    }
  };

  return (
    <div className="space-y-4">
      <LeagueSelector />
      <TeamDisplay />
      <TeamSaveLoad />

      {isDataReady && (
        <PokemonSearch
          onSelect={handleSelect}
          disabled={!hasEmptySlot}
        />
      )}

      <TeamAnalysis />
      <MetaOverview />
      <TypeCoverageGrid />

      {isDataReady && (
        <RecommendationList
          recommendations={recommendations}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
