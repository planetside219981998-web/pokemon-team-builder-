import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { getMoveName } from '@/i18n/moveNames';
import { useMoveMap } from '@/hooks/useMoveMap';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { StatBar } from '@/components/shared/StatBar';
import type { Recommendation, PokemonType } from '@/data/types';

const TYPE_BG: Record<string, string> = {
  normal: 'bg-[#A8A77A]/20 border-[#A8A77A]/40', fire: 'bg-[#EE8130]/20 border-[#EE8130]/40',
  water: 'bg-[#6390F0]/20 border-[#6390F0]/40', electric: 'bg-[#F7D02C]/20 border-[#F7D02C]/40',
  grass: 'bg-[#7AC74C]/20 border-[#7AC74C]/40', ice: 'bg-[#96D9D6]/20 border-[#96D9D6]/40',
  fighting: 'bg-[#C22E28]/20 border-[#C22E28]/40', poison: 'bg-[#A33EA1]/20 border-[#A33EA1]/40',
  ground: 'bg-[#E2BF65]/20 border-[#E2BF65]/40', flying: 'bg-[#A98FF3]/20 border-[#A98FF3]/40',
  psychic: 'bg-[#F95587]/20 border-[#F95587]/40', bug: 'bg-[#A6B91A]/20 border-[#A6B91A]/40',
  rock: 'bg-[#B6A136]/20 border-[#B6A136]/40', ghost: 'bg-[#735797]/20 border-[#735797]/40',
  dragon: 'bg-[#6F35FC]/20 border-[#6F35FC]/40', dark: 'bg-[#705746]/20 border-[#705746]/40',
  steel: 'bg-[#B7B7CE]/20 border-[#B7B7CE]/40', fairy: 'bg-[#D685AD]/20 border-[#D685AD]/40',
};

function MoveBadge({ moveId, locale, moveMap }: {
  moveId: string;
  locale: string;
  moveMap: Map<string, { name: string; type: PokemonType }>;
}) {
  const move = moveMap.get(moveId);
  const name = move ? getMoveName(moveId, move.name, locale) : moveId.replace(/_/g, ' ').toLowerCase();
  const type = move?.type ?? 'normal';

  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs ${TYPE_BG[type] ?? 'bg-slate-700 border-slate-600'}`}>
      {name}
    </span>
  );
}

interface PokemonCardProps {
  rec: Recommendation;
  rank: number;
  onAdd: () => void;
  canAdd: boolean;
}

export function PokemonCard({ rec, rank, onAdd, canAdd }: PokemonCardProps) {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const [expanded, setExpanded] = useState(false);
  const moveMap = useMoveMap();

  const name = getPokemonName(rec.pokemon.speciesId, rec.pokemon.speciesName, language);
  const fastMove = rec.recommendedMoveset[0];
  const chargedMoves = rec.recommendedMoveset.slice(1);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-lg font-bold text-slate-500 w-8 shrink-0">#{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{name}</h3>
            <span className="text-xs text-slate-400">#{rec.pokemon.dex}</span>
          </div>
          <div className="flex gap-1 mb-2">
            {rec.pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>

          {/* Moves with type-colored badges */}
          <div className="mb-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 w-10 shrink-0">{t('recommendations.fastMove')}</span>
              {fastMove && (
                <MoveBadge
                  moveId={fastMove}
                  locale={language}
                  moveMap={moveMap as Map<string, { name: string; type: PokemonType }>}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 w-10 shrink-0">{t('recommendations.chargedMoves')}</span>
              {chargedMoves.map((m) => (
                <MoveBadge
                  key={m}
                  moveId={m}
                  locale={language}
                  moveMap={moveMap as Map<string, { name: string; type: PokemonType }>}
                />
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                style={{ width: `${rec.score}%` }}
              />
            </div>
            <span className="text-sm font-mono font-bold text-red-400">
              {rec.score.toFixed(1)}
            </span>
          </div>
        </div>

        {canAdd && (
          <button
            onClick={onAdd}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-medium transition-colors"
          >
            +
          </button>
        )}
      </div>

      {/* Reasoning */}
      <div className="px-4 pb-2">
        <ul className="space-y-1">
          {rec.reasoning.slice(0, 3).map((reason, i) => (
            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
              <span className="text-green-400 mt-0.5">+</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors border-t border-slate-700"
      >
        {expanded ? '- ' : '+ '}{t('recommendations.scoreBreakdown')}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-1.5">
            <StatBar label={t('recommendations.meta')} value={rec.scoreBreakdown.metaScore} color="bg-purple-500" />
            <StatBar label={t('recommendations.coverage')} value={rec.scoreBreakdown.coverageScore} color="bg-blue-500" />
            <StatBar label={t('recommendations.synergy')} value={rec.scoreBreakdown.synergyScore} color="bg-green-500" />
            <StatBar label={t('recommendations.bulk')} value={rec.scoreBreakdown.bulkScore} color="bg-yellow-500" />
            <StatBar label={t('recommendations.accessibility')} value={rec.scoreBreakdown.accessibilityScore} color="bg-cyan-500" />
          </div>

          {rec.matchupProbabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-1">{t('recommendations.matchups')}</h4>
              <div className="grid grid-cols-2 gap-1">
                {rec.matchupProbabilities.slice(0, 6).map((m) => (
                  <div key={m.opponent} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-700/50">
                    <span className="truncate">{getPokemonName(m.opponent, m.opponentName, language)}</span>
                    <span className={`font-mono font-medium ${m.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                      {(m.winRate * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rec.weaknessTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-1">{t('recommendations.weaknesses')}</h4>
              <div className="flex flex-wrap gap-1">
                {rec.weaknessTypes.map((type) => (
                  <TypeBadge key={type} type={type} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
