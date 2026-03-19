import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { getMoveName } from '@/i18n/moveNames';
import { useMoveMap } from '@/hooks/useMoveMap';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { StatBar } from '@/components/shared/StatBar';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_BG, TYPE_HEX } from '@/data/typeColors';
import type { Recommendation, PokemonType } from '@/data/types';

function MoveBadge({ moveId, locale, moveMap }: {
  moveId: string;
  locale: string;
  moveMap: Map<string, { name: string; type: PokemonType }>;
}) {
  const move = moveMap.get(moveId);
  const name = move ? getMoveName(moveId, move.name, locale) : moveId.replace(/_/g, ' ').toLowerCase();
  const type = move?.type ?? 'normal';

  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg border text-xs ${TYPE_BG[type] ?? 'bg-slate-700 border-slate-600'}`}>
      {name}
    </span>
  );
}

const SCORE_COLORS = [
  { key: 'metaScore', color: '#a855f7', label: 'meta' },
  { key: 'coverageScore', color: '#3b82f6', label: 'coverage' },
  { key: 'synergyScore', color: '#22c55e', label: 'synergy' },
  { key: 'bulkScore', color: '#eab308', label: 'bulk' },
  { key: 'accessibilityScore', color: '#06b6d4', label: 'accessibility' },
];

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
  const primaryType = rec.pokemon.types[0] ?? 'normal';
  const typeColor = TYPE_HEX[primaryType] ?? '#475569';

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slideUp glass-card"
      style={{ borderColor: `${typeColor}25` }}
    >
      {/* Header */}
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full blur-lg opacity-30" style={{ backgroundColor: typeColor }} />
          <img
            src={spriteUrl(rec.pokemon.dex)}
            alt={name}
            className="w-14 h-14 drop-shadow-lg relative z-[1]"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span
            className="absolute -top-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md z-[2]"
            style={{ backgroundColor: typeColor }}
          >
            {rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{name}</h3>
          </div>
          <div className="flex gap-1 mb-2.5">
            {rec.pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>

          <div className="mb-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 w-10 shrink-0 font-medium">{t('recommendations.fastMove')}</span>
              {fastMove && <MoveBadge moveId={fastMove} locale={language} moveMap={moveMap as Map<string, { name: string; type: PokemonType }>} />}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 w-10 shrink-0 font-medium">{t('recommendations.chargedMoves')}</span>
              {chargedMoves.map((m) => (
                <MoveBadge key={m} moveId={m} locale={language} moveMap={moveMap as Map<string, { name: string; type: PokemonType }>} />
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-barGrow"
                style={{
                  width: `${rec.score}%`,
                  background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308)',
                }}
              />
            </div>
            <span className="text-sm font-mono font-bold text-red-400">
              {rec.score.toFixed(1)}
            </span>
          </div>

          {/* Mini score breakdown */}
          <div className="flex gap-1 mt-2">
            {SCORE_COLORS.map(({ key, color }) => {
              const val = rec.scoreBreakdown[key as keyof typeof rec.scoreBreakdown] as number;
              return (
                <div key={key} className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden" title={key}>
                  <div className="h-full rounded-full animate-barGrow" style={{ width: `${val}%`, backgroundColor: color }} />
                </div>
              );
            })}
          </div>
        </div>

        {canAdd && (
          <button
            onClick={onAdd}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
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
              <span className="text-green-400 mt-0.5 font-bold">+</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expandable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors border-t border-slate-700/30"
      >
        {expanded ? '- ' : '+ '}{t('recommendations.scoreBreakdown')}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-slideUp">
          <div className="space-y-2">
            <StatBar label={t('recommendations.meta')} value={rec.scoreBreakdown.metaScore} color="bg-purple-500" />
            <StatBar label={t('recommendations.coverage')} value={rec.scoreBreakdown.coverageScore} color="bg-blue-500" />
            <StatBar label={t('recommendations.synergy')} value={rec.scoreBreakdown.synergyScore} color="bg-green-500" />
            <StatBar label={t('recommendations.bulk')} value={rec.scoreBreakdown.bulkScore} color="bg-yellow-500" />
            <StatBar label={t('recommendations.accessibility')} value={rec.scoreBreakdown.accessibilityScore} color="bg-cyan-500" />
          </div>

          {rec.matchupProbabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">{t('recommendations.matchups')}</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {rec.matchupProbabilities.slice(0, 6).map((m) => {
                  const winPct = m.winRate * 100;
                  return (
                    <div key={m.opponent} className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-xl bg-slate-700/30 border border-slate-600/20">
                      <span className="truncate flex-1">{getPokemonName(m.opponent, m.opponentName, language)}</span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-600/50 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${winPct}%`,
                            backgroundColor: winPct >= 50 ? '#22c55e' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className={`font-mono font-semibold w-8 text-right ${winPct >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {winPct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rec.weaknessTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1.5">{t('recommendations.weaknesses')}</h4>
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
