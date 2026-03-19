import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db, getRankings } from '@/data/db';
import { getPokemonName } from '@/i18n/pokemonNames';
import { spriteUrl } from '@/utils/sprites';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { TYPE_HEX } from '@/data/typeColors';
import { getWeaknesses, getResistances } from '@/engine/typeChart';
import { displayTypes } from '@/data/types';
import type { Pokemon, RankedPokemon } from '@/data/types';

interface MetaPokemon {
  pokemon: Pokemon;
  ranking: RankedPokemon;
}

interface TierGroup {
  label: string;
  tierClass: string;
  pokemon: MetaPokemon[];
}

interface Props {
  startExpanded?: boolean;
}

function getTierGroups(metaPokemon: MetaPokemon[]): TierGroup[] {
  if (metaPokemon.length === 0) return [];

  const maxScore = metaPokemon[0]!.ranking.score;
  const tierS: MetaPokemon[] = [];
  const tierA: MetaPokemon[] = [];
  const tierB: MetaPokemon[] = [];

  for (const mp of metaPokemon) {
    const ratio = mp.ranking.score / maxScore;
    if (ratio >= 0.9) tierS.push(mp);
    else if (ratio >= 0.75) tierA.push(mp);
    else tierB.push(mp);
  }

  const tiers: TierGroup[] = [
    { label: 'S', tierClass: 'tier-s', pokemon: tierS },
    { label: 'A', tierClass: 'tier-a', pokemon: tierA },
    { label: 'B', tierClass: 'tier-b', pokemon: tierB },
  ];

  return tiers.filter((t) => t.pokemon.length > 0);
}

export function MetaOverview({ startExpanded = false }: Props) {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const selectedLeague = useAppStore((s) => s.selectedLeague);
  const selectedCp = useAppStore((s) => s.selectedCp);
  const addToTeam = useAppStore((s) => s.addToTeam);
  const team = useAppStore((s) => s.team);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [metaPokemon, setMetaPokemon] = useState<MetaPokemon[]>([]);
  const [showCount, setShowCount] = useState(30);
  const [expanded, setExpanded] = useState(startExpanded);
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

  const hasEmptySlot = team.some((s) => s === null);
  const teamCount = team.filter((s) => s !== null).length;

  // Auto-expand when team is empty
  useEffect(() => {
    if (teamCount === 0) setExpanded(true);
  }, [teamCount]);

  useEffect(() => {
    if (syncStatus !== 'ready') return;

    const league = selectedLeague === 'all' ? 'great' : selectedLeague;
    const cp = selectedLeague === 'all' ? 1500 : selectedCp;

    Promise.all([
      getRankings(league, cp),
      db.pokemon.toArray(),
    ]).then(([rankings, allPokemon]) => {
      const pokemonMap = new Map<string, Pokemon>();
      for (const p of allPokemon) pokemonMap.set(p.speciesId, p);

      const sorted = rankings
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map((r) => {
          const pokemon = pokemonMap.get(r.speciesId);
          if (!pokemon) return null;
          return { pokemon, ranking: r };
        })
        .filter(Boolean) as MetaPokemon[];

      setMetaPokemon(sorted);
    });
  }, [syncStatus, selectedLeague, selectedCp]);

  if (metaPokemon.length === 0) return null;

  const maxScore = metaPokemon[0]?.ranking.score ?? 100;
  const leagueLabel = selectedLeague === 'all' ? t('league.great') :
    selectedLeague === 'great' ? t('league.great') :
    selectedLeague === 'ultra' ? t('league.ultra') :
    t('league.master');

  const tiers = getTierGroups(metaPokemon.slice(0, showCount));

  return (
    <div className="glass-card rounded-2xl overflow-hidden" style={{
      borderColor: 'rgba(234, 179, 8, 0.15)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <h2 className="font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.1))',
            border: '1px solid rgba(234, 179, 8, 0.2)',
          }}>
            <svg className="w-4.5 h-4.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span>
            {t('meta.title')}
            <span className="text-slate-400 font-normal text-sm ml-2">- {leagueLabel}</span>
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:block">{t('meta.subtitle').split('.')[0]}</span>
          <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Prominent hint when team is empty */}
          {teamCount === 0 && (
            <div className="mb-4 p-3 rounded-xl text-center animate-slideUp" style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(234, 179, 8, 0.15)',
            }}>
              <p className="text-sm text-yellow-300/90 font-medium">{t('meta.emptyTeamHint')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('meta.subtitle')}</p>
            </div>
          )}

          {/* Tier groups */}
          {tiers.map((tier) => (
            <div key={tier.label} className="mb-4 last:mb-0">
              {/* Tier header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`${tier.tierClass} w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-md`}>
                  {tier.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent" />
                <span className="text-[10px] text-slate-500 font-medium">{tier.pokemon.length} Pokemon</span>
              </div>

              {/* Pokemon list */}
              <div className="space-y-1">
                {tier.pokemon.map((mp) => {
                  const primaryType = mp.pokemon.types[0] ?? 'normal';
                  const typeColor = TYPE_HEX[primaryType] ?? '#475569';
                  const scorePct = (mp.ranking.score / maxScore) * 100;
                  const isInTeam = team.some((s) => s?.pokemon.speciesId === mp.pokemon.speciesId);
                  const isExpanded = selectedDetail === mp.pokemon.speciesId;
                  const globalIdx = metaPokemon.indexOf(mp);

                  return (
                    <div key={mp.pokemon.speciesId}>
                      <div
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all cursor-pointer ${
                          isInTeam ? 'ring-1 ring-green-500/40' :
                          isExpanded ? '' : 'hover:bg-white/[0.03]'
                        }`}
                        style={
                          isInTeam ? { background: 'rgba(34, 197, 94, 0.06)' } :
                          isExpanded ? { background: 'rgba(51, 65, 85, 0.3)' } : undefined
                        }
                        onClick={() => setSelectedDetail(isExpanded ? null : mp.pokemon.speciesId)}
                      >
                        {/* Rank */}
                        <span className={`text-xs font-bold w-6 text-center shrink-0 ${
                          globalIdx < 3 ? 'text-yellow-400' : globalIdx < 10 ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          #{globalIdx + 1}
                        </span>

                        {/* Sprite */}
                        <img src={spriteUrl(mp.pokemon.dex)} alt="" className="w-10 h-10 drop-shadow-md shrink-0" loading="lazy" />

                        {/* Name + Types */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {getPokemonName(mp.pokemon.speciesId, mp.pokemon.speciesName, language)}
                          </div>
                          <div className="flex gap-1 mt-0.5">
                            {displayTypes(mp.pokemon.types).map((type) => (
                              <span
                                key={type}
                                className="text-[9px] px-1.5 py-px rounded-md text-white/90 font-medium"
                                style={{ backgroundColor: `${TYPE_HEX[type]}99` }}
                              >
                                {t(`types.${type}`)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="w-20 shrink-0 hidden sm:block">
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full animate-barGrow"
                              style={{
                                width: `${scorePct}%`,
                                background: `linear-gradient(90deg, ${typeColor}, ${typeColor}88)`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right font-mono font-medium shrink-0">
                          {mp.ranking.score.toFixed(0)}
                        </span>

                        {/* Add / In Team */}
                        {hasEmptySlot && !isInTeam && (
                          <button
                            onClick={(e) => { e.stopPropagation(); addToTeam(mp.pokemon, mp.ranking); }}
                            className="p-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-600 hover:text-white transition-all shrink-0 hover:scale-110"
                            title={t('recommendations.addToTeam')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}

                        {isInTeam && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 bg-green-500/15 text-green-400">
                            {t('meta.inTeam')}
                          </span>
                        )}
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="ml-9 mr-2 mt-1 mb-2 p-3 rounded-xl animate-slideUp" style={{
                          background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.2), rgba(30, 41, 59, 0.3))',
                          border: '1px solid rgba(71, 85, 105, 0.3)',
                        }}>
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {[
                              { label: 'ATK', value: mp.pokemon.baseStats.atk, color: '#f87171' },
                              { label: 'DEF', value: mp.pokemon.baseStats.def, color: '#60a5fa' },
                              { label: 'HP', value: mp.pokemon.baseStats.hp, color: '#4ade80' },
                            ].map((stat) => (
                              <div key={stat.label} className="text-center">
                                <div className="text-[10px] text-slate-500 font-medium">{stat.label}</div>
                                <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                              </div>
                            ))}
                          </div>

                          {/* Weaknesses */}
                          <div className="mb-2">
                            <span className="text-[10px] text-red-400 font-semibold">{t('raids.weakTo')}: </span>
                            <span className="inline-flex flex-wrap gap-1 mt-0.5">
                              {getWeaknesses(mp.pokemon.types).map((type) => (
                                <TypeBadge key={type} type={type} size="sm" />
                              ))}
                            </span>
                          </div>

                          {/* Resistances */}
                          <div className="mb-2">
                            <span className="text-[10px] text-green-400 font-semibold">{t('raids.resistsLabel')}: </span>
                            <span className="inline-flex flex-wrap gap-1 mt-0.5">
                              {getResistances(mp.pokemon.types).map((type) => (
                                <TypeBadge key={type} type={type} size="sm" />
                              ))}
                            </span>
                          </div>

                          {/* Moves */}
                          {mp.ranking.moveset && mp.ranking.moveset.length > 0 && (
                            <div className="text-xs text-slate-400 pt-2 border-t border-slate-600/30">
                              <span className="font-semibold text-slate-300">{t('recommendations.moves')}: </span>
                              {mp.ranking.moveset.join(' / ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {showCount < metaPokemon.length && (
            <button
              onClick={() => setShowCount((c) => Math.min(c + 20, 50))}
              className="w-full mt-2 py-2.5 text-sm text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.03]"
            >
              {t('meta.showMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
