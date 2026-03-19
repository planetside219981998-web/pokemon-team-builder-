import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db } from '@/data/db';
import { getRaidCounters, type RaidCounter } from '@/engine/raidScorer';
import { getWeaknesses, getResistances } from '@/engine/typeChart';
import { getPokemonName } from '@/i18n/pokemonNames';
import { getMoveName } from '@/i18n/moveNames';
import { PokemonSearch } from '@/components/search/PokemonSearch';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_BG, TYPE_HEX } from '@/data/typeColors';
import { fetchCurrentRaidBosses, type RaidBossByTier } from '@/data/raidBosses';
import { displayTypes } from '@/data/types';
import type { Pokemon, PokemonType } from '@/data/types';

const WEATHER_OPTIONS = [
  'noWeather', 'sunny', 'rainy', 'partlyCloudy', 'cloudy', 'windy', 'snow', 'fog',
] as const;

const FRIEND_OPTIONS = [
  'none', 'good', 'great', 'ultra', 'best',
] as const;

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  '5': { bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.25)', text: '#fbbf24', label: 'T5' },
  'mega_legendary': { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7', label: 'ML' },
  '6': { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7', label: 'P' },
  'mega': { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', text: '#ec4899', label: 'M' },
  'ultra_beast': { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa', label: 'UB' },
  '3': { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.25)', text: '#fb923c', label: 'T3' },
  '1': { bg: 'rgba(107, 114, 128, 0.08)', border: 'rgba(107, 114, 128, 0.25)', text: '#9ca3af', label: 'T1' },
};

export function RaidsPage() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [boss, setBoss] = useState<Pokemon | null>(null);
  const [weather, setWeather] = useState<string>('noWeather');
  const [friendBoost, setFriendBoost] = useState<string>('none');
  const [counters, setCounters] = useState<RaidCounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [raidBosses, setRaidBosses] = useState<RaidBossByTier[]>([]);
  const [loadingBosses, setLoadingBosses] = useState(false);

  const isDataReady = syncStatus === 'ready';

  // Fetch current raid bosses
  useEffect(() => {
    if (!isDataReady) return;
    setLoadingBosses(true);
    fetchCurrentRaidBosses()
      .then(setRaidBosses)
      .finally(() => setLoadingBosses(false));
  }, [isDataReady]);

  const findCounters = useCallback(async (bossP: Pokemon, w: string, f: string) => {
    setLoading(true);
    try {
      const [allPokemon, allMoves] = await Promise.all([
        db.pokemon.toArray(),
        db.moves.toArray(),
      ]);
      const results = getRaidCounters(bossP.types, allPokemon, allMoves, w, f, 20);
      setCounters(results);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectBoss = (pokemon: Pokemon) => {
    setBoss(pokemon);
    findCounters(pokemon, weather, friendBoost);
  };

  const handleWeatherChange = (w: string) => {
    setWeather(w);
    if (boss) findCounters(boss, w, friendBoost);
  };

  const handleFriendChange = (f: string) => {
    setFriendBoost(f);
    if (boss) findCounters(boss, weather, f);
  };

  const maxDpsTdo = counters.length > 0 ? counters[0]!.dpsTimesTdo : 1;
  const bossWeaknesses = boss ? getWeaknesses(boss.types as PokemonType[]) : [];
  const bossResistances = boss ? getResistances(boss.types as PokemonType[]) : [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.1))',
          border: '1px solid rgba(249, 115, 22, 0.2)',
        }}>
          <svg className="w-4.5 h-4.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        {t('raids.title')}
      </h1>

      {/* Current Raid Bosses */}
      {loadingBosses && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{t('raids.loadingBosses', 'Loading current raid bosses...')}</p>
        </div>
      )}

      {raidBosses.length > 0 && !boss && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/30">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t('raids.currentBosses', 'Current Raid Bosses')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('raids.currentBossesHint', 'Tap a boss to find the best counters')}</p>
          </div>

          <div className="p-4 space-y-5">
            {raidBosses.map((tier) => {
              const colors = TIER_COLORS[tier.tier] ?? TIER_COLORS['1']!;
              return (
                <div key={tier.tier}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}>
                      {tier.tierLabel}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600/50 to-transparent" />
                    <span className="text-[10px] text-slate-500">{tier.bosses.length} Boss{tier.bosses.length > 1 ? 'es' : ''}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tier.bosses.map(({ pokemon, entry }) => {
                      const typeColor = TYPE_HEX[pokemon.types[0] ?? 'normal'] ?? '#475569';
                      return (
                        <button
                          key={`${pokemon.speciesId}-${tier.tier}`}
                          onClick={() => handleSelectBoss(pokemon)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer group"
                          style={{
                            background: `linear-gradient(135deg, ${typeColor}12, rgba(15, 23, 42, 0.6))`,
                            border: `1px solid ${typeColor}30`,
                          }}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={spriteUrl(pokemon.dex)}
                              alt=""
                              className="w-12 h-12 drop-shadow-md group-hover:scale-110 transition-transform"
                              loading="lazy"
                            />
                            {entry.shiny && (
                              <span className="absolute -top-0.5 -right-0.5 text-[10px]" title="Shiny available">*</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold text-white truncate">
                              {getPokemonName(pokemon.speciesId, pokemon.speciesName, language)}
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              {displayTypes(pokemon.types).map((type) => (
                                <span
                                  key={type}
                                  className="text-[9px] px-1.5 py-px rounded-md text-white/80 font-medium"
                                  style={{ backgroundColor: `${TYPE_HEX[type]}90` }}
                                >
                                  {t(`types.${type}`)}
                                </span>
                              ))}
                            </div>
                            {entry.maxCp > 0 && (
                              <div className="text-[10px] text-slate-500 mt-0.5">CP {entry.maxCp}</div>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual boss search (always available as fallback) */}
      {isDataReady && !boss && (
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-2">
            {raidBosses.length > 0 ? t('raids.orSearch', 'Or search any Pokemon:') : t('raids.selectBoss')}
          </label>
          <PokemonSearch onSelect={handleSelectBoss} />
        </div>
      )}

      {/* Selected boss display */}
      {boss && (
        <div
          className="glass-card rounded-2xl p-4 animate-scaleIn"
          style={{ borderColor: `${TYPE_HEX[boss.types[0] ?? 'normal'] ?? '#475569'}40` }}
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ backgroundColor: TYPE_HEX[boss.types[0] ?? 'normal'] }} />
              <img
                src={spriteUrl(boss.dex)}
                alt={boss.speciesName}
                className="w-20 h-20 drop-shadow-xl relative z-[1]"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl">
                {getPokemonName(boss.speciesId, boss.speciesName, language)}
              </h3>
              <div className="flex gap-1 mt-1">
                {displayTypes(boss.types).map((type) => (
                  <TypeBadge key={type} type={type} size="md" />
                ))}
              </div>
            </div>
            <button
              onClick={() => { setBoss(null); setCounters([]); }}
              className="px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-sm transition-colors border border-slate-600/30"
            >
              {t('team.removeSlot')}
            </button>
          </div>

          {/* Boss Weaknesses & Resistances */}
          <div className="mt-3 pt-3 border-t border-slate-700/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bossWeaknesses.length > 0 && (
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(153, 27, 27, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <span className="text-xs text-red-400 font-semibold block mb-1.5">{t('raids.weakTo')}</span>
                <div className="flex flex-wrap gap-1">
                  {bossWeaknesses.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
                </div>
              </div>
            )}
            {bossResistances.length > 0 && (
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(20, 83, 45, 0.1)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                <span className="text-xs text-green-400 font-semibold block mb-1.5">{t('raids.resistsLabel')}</span>
                <div className="flex flex-wrap gap-1">
                  {bossResistances.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {boss && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-3">
            <label className="text-xs font-semibold text-slate-300 block mb-2">{t('raids.weatherBoost')}</label>
            <select
              value={weather}
              onChange={(e) => handleWeatherChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/40 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>{t(`raids.${w}`)}</option>
              ))}
            </select>
          </div>
          <div className="glass-card rounded-2xl p-3">
            <label className="text-xs font-semibold text-slate-300 block mb-2">{t('raids.friendBoost')}</label>
            <select
              value={friendBoost}
              onChange={(e) => handleFriendChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/40 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {FRIEND_OPTIONS.map((f) => (
                <option key={f} value={f}>{t(`raids.${f}`)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Counter Results */}
      {loading && <LoadingSpinner message={t('recommendations.loading')} />}

      {!loading && counters.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.1))',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {t('raids.bestCounters', 'Best Counters')}
            {boss && (
              <span className="text-xs text-slate-400 font-normal">
                vs. {getPokemonName(boss.speciesId, boss.speciesName, language)}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {counters.map((counter, idx) => {
              const cTypeColor = TYPE_HEX[counter.pokemon.types[0] ?? 'normal'] ?? '#475569';
              return (
                <div
                  key={`${counter.pokemon.speciesId}-${counter.fastMove.moveId}-${counter.chargedMove.moveId}`}
                  className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 animate-slideUp"
                  style={{ borderColor: `${cTypeColor}20` }}
                >
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full blur-md opacity-20" style={{ backgroundColor: cTypeColor }} />
                    <img
                      src={spriteUrl(counter.pokemon.dex)}
                      alt={counter.pokemon.speciesName}
                      className="w-12 h-12 drop-shadow-lg relative z-[1]"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white z-[2]"
                      style={{ backgroundColor: cTypeColor }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">
                        {getPokemonName(counter.pokemon.speciesId, counter.pokemon.speciesName, language)}
                      </h3>
                      {counter.weatherBoosted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(234, 179, 8, 0.2)',
                        }}>WB</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-lg border text-xs ${TYPE_BG[counter.fastMove.type] ?? ''}`}>
                        {getMoveName(counter.fastMove.moveId, counter.fastMove.name, language)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-lg border text-xs ${TYPE_BG[counter.chargedMove.type] ?? ''}`}>
                        {getMoveName(counter.chargedMove.moveId, counter.chargedMove.name, language)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-barGrow"
                          style={{
                            width: `${(counter.dpsTimesTdo / maxDpsTdo) * 100}%`,
                            background: 'linear-gradient(90deg, #f97316, #ef4444)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs space-y-0.5">
                    <div>
                      <span className="text-slate-500">{t('raids.dps')}: </span>
                      <span className="font-mono font-semibold text-orange-400">{counter.dps.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{t('raids.tdo')}: </span>
                      <span className="font-mono font-semibold text-blue-400">{counter.tdo.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !boss && raidBosses.length === 0 && !loadingBosses && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.3), rgba(30, 41, 59, 0.5))',
            border: '2px dashed rgba(100, 116, 139, 0.3)',
          }}>
            <svg className="w-10 h-10 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-slate-400">{t('raids.noCounters')}</p>
        </div>
      )}
    </div>
  );
}
