import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db, getRankings } from '@/data/db';
import { getPokemonName } from '@/i18n/pokemonNames';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_HEX } from '@/data/typeColors';
import type { Pokemon, RankedPokemon } from '@/data/types';

interface MetaPokemon {
  pokemon: Pokemon;
  ranking: RankedPokemon;
}

export function MetaOverview() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const selectedLeague = useAppStore((s) => s.selectedLeague);
  const selectedCp = useAppStore((s) => s.selectedCp);
  const addToTeam = useAppStore((s) => s.addToTeam);
  const team = useAppStore((s) => s.team);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [metaPokemon, setMetaPokemon] = useState<MetaPokemon[]>([]);
  const [showCount, setShowCount] = useState(20);
  const [expanded, setExpanded] = useState(true);

  const hasEmptySlot = team.some((s) => s === null);

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

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {t('meta.title')}
        </h2>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 mb-3">{t('meta.subtitle')}</p>
          <div className="space-y-1.5">
            {metaPokemon.slice(0, showCount).map((mp, idx) => {
              const primaryType = mp.pokemon.types[0] ?? 'normal';
              const typeColor = TYPE_HEX[primaryType] ?? '#475569';
              const scorePct = (mp.ranking.score / maxScore) * 100;
              const isInTeam = team.some((s) => s?.pokemon.speciesId === mp.pokemon.speciesId);

              return (
                <div
                  key={mp.pokemon.speciesId}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-slate-700/40 ${isInTeam ? 'ring-1 ring-green-500/50 bg-green-900/10' : ''}`}
                >
                  {/* Rank */}
                  <span className={`text-xs font-bold w-6 text-center ${
                    idx < 3 ? 'text-yellow-400' : idx < 10 ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Sprite */}
                  <img src={spriteUrl(mp.pokemon.dex)} alt="" className="w-8 h-8" loading="lazy" />

                  {/* Name + Types */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {getPokemonName(mp.pokemon.speciesId, mp.pokemon.speciesName, language)}
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {mp.pokemon.types.map((type) => (
                        <span
                          key={type}
                          className="text-[8px] px-1 py-px rounded-full text-white font-medium"
                          style={{ backgroundColor: `${TYPE_HEX[type]}cc` }}
                        >
                          {t(`types.${type}`).slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full animate-barGrow"
                      style={{
                        width: `${scorePct}%`,
                        background: `linear-gradient(90deg, ${typeColor}, ${typeColor}88)`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-8 text-right">{mp.ranking.score.toFixed(0)}</span>

                  {/* Add button */}
                  {hasEmptySlot && !isInTeam && (
                    <button
                      onClick={() => addToTeam(mp.pokemon, mp.ranking)}
                      className="p-1 rounded-lg bg-green-600/30 text-green-400 hover:bg-green-600/50 transition-colors"
                      title={t('recommendations.addToTeam')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {showCount < metaPokemon.length && (
            <button
              onClick={() => setShowCount((c) => Math.min(c + 20, 50))}
              className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {t('meta.showMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
