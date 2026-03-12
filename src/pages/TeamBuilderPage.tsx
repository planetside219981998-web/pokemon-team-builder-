import { useAppStore } from '@/store/appStore';
import { useTeamBuilder } from '@/hooks/useTeamBuilder';
import { LeagueSelector } from '@/components/league/LeagueSelector';
import { TeamDisplay } from '@/components/team/TeamDisplay';
import { PokemonSearch } from '@/components/search/PokemonSearch';
import { TypeCoverageGrid } from '@/components/results/TypeCoverageGrid';
import { RecommendationList } from '@/components/results/RecommendationList';
import type { Pokemon } from '@/data/types';

export function TeamBuilderPage() {
  const team = useAppStore((s) => s.team);
  const addToTeam = useAppStore((s) => s.addToTeam);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const { recommendations, loading, error } = useTeamBuilder();

  const hasEmptySlot = team.some((s) => s === null);
  const isDataReady = syncStatus === 'ready';

  const handleSelect = (pokemon: Pokemon, cp?: number) => {
    if (hasEmptySlot) {
      addToTeam(pokemon, undefined, cp);
    }
  };

  return (
    <div className="space-y-4">
      <LeagueSelector />
      <TeamDisplay />

      {isDataReady && (
        <PokemonSearch
          onSelect={handleSelect}
          disabled={!hasEmptySlot}
        />
      )}

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
