import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { PokemonCard } from '@/components/team/PokemonCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Recommendation } from '@/data/types';

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
}

export function RecommendationList({ recommendations, loading, error }: RecommendationListProps) {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const addToTeam = useAppStore((s) => s.addToTeam);

  const hasEmptySlot = team.some((s) => s === null);
  const hasTeamMembers = team.some((s) => s !== null);

  if (!hasTeamMembers) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">{t('recommendations.empty')}</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={t('recommendations.loading')} />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-slate-400 mb-3">{t('recommendations.title')}</h2>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <PokemonCard
            key={rec.pokemon.speciesId}
            rec={rec}
            rank={idx + 1}
            canAdd={hasEmptySlot}
            onAdd={() => addToTeam(rec.pokemon, rec.ranking)}
          />
        ))}
      </div>
    </div>
  );
}
