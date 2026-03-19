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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.3), rgba(30, 41, 59, 0.5))',
          border: '2px dashed rgba(100, 116, 139, 0.3)',
        }}>
          <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">{t('recommendations.empty')}</p>
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
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.1))',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        {t('recommendations.title')}
      </h2>
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
