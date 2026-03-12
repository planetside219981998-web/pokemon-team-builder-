import { useState, useCallback } from 'react';
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
import type { Pokemon, PokemonType } from '@/data/types';

const WEATHER_OPTIONS = [
  'noWeather', 'sunny', 'rainy', 'partlyCloudy', 'cloudy', 'windy', 'snow', 'fog',
] as const;

const FRIEND_OPTIONS = [
  'none', 'good', 'great', 'ultra', 'best',
] as const;

export function RaidsPage() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [boss, setBoss] = useState<Pokemon | null>(null);
  const [weather, setWeather] = useState<string>('noWeather');
  const [friendBoost, setFriendBoost] = useState<string>('none');
  const [counters, setCounters] = useState<RaidCounter[]>([]);
  const [loading, setLoading] = useState(false);

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

  const isDataReady = syncStatus === 'ready';
  const maxDpsTdo = counters.length > 0 ? counters[0]!.dpsTimesTdo : 1;

  // Boss type analysis
  const bossWeaknesses = boss ? getWeaknesses(boss.types as PokemonType[]) : [];
  const bossResistances = boss ? getResistances(boss.types as PokemonType[]) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('raids.title')}</h1>

      {/* Boss selection */}
      {isDataReady && (
        <div>
          <label className="text-sm font-medium text-slate-400 block mb-2">{t('raids.selectBoss')}</label>
          {boss ? (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border p-4 shadow-lg"
              style={{ borderColor: `${TYPE_HEX[boss.types[0] ?? 'normal'] ?? '#475569'}60` }}
            >
              <div className="flex items-center gap-4">
                <img
                  src={spriteUrl(boss.dex)}
                  alt={boss.speciesName}
                  className="w-20 h-20 drop-shadow-xl"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-xl">
                    {getPokemonName(boss.speciesId, boss.speciesName, language)}
                  </h3>
                  <div className="flex gap-1 mt-1">
                    {boss.types.map((type) => (
                      <TypeBadge key={type} type={type} size="md" />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setBoss(null); setCounters([]); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  {t('team.removeSlot')}
                </button>
              </div>

              {/* Boss Weaknesses & Resistances */}
              <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bossWeaknesses.length > 0 && (
                  <div>
                    <span className="text-xs text-red-400 font-medium block mb-1">{t('raids.weakTo')}</span>
                    <div className="flex flex-wrap gap-1">
                      {bossWeaknesses.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
                {bossResistances.length > 0 && (
                  <div>
                    <span className="text-xs text-green-400 font-medium block mb-1">{t('raids.resists')}</span>
                    <div className="flex flex-wrap gap-1">
                      {bossResistances.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <PokemonSearch onSelect={handleSelectBoss} />
          )}
        </div>
      )}

      {/* Filters */}
      {boss && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-3 shadow-md">
            <label className="text-xs font-medium text-slate-400 block mb-2">{t('raids.weatherBoost')}</label>
            <select
              value={weather}
              onChange={(e) => handleWeatherChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>{t(`raids.${w}`)}</option>
              ))}
            </select>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-3 shadow-md">
            <label className="text-xs font-medium text-slate-400 block mb-2">{t('raids.friendBoost')}</label>
            <select
              value={friendBoost}
              onChange={(e) => handleFriendChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {FRIEND_OPTIONS.map((f) => (
                <option key={f} value={f}>{t(`raids.${f}`)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {loading && <LoadingSpinner message={t('recommendations.loading')} />}

      {!loading && counters.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">
            {t('raids.topCounters')} ({t('raids.results', { count: counters.length })})
          </h2>
          <div className="space-y-2">
            {counters.map((counter, idx) => {
              const cTypeColor = TYPE_HEX[counter.pokemon.types[0] ?? 'normal'] ?? '#475569';
              return (
                <div
                  key={`${counter.pokemon.speciesId}-${idx}`}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900 rounded-xl border px-4 py-3 flex items-center gap-3 shadow-md animate-slideUp"
                  style={{ borderColor: `${cTypeColor}30` }}
                >
                  <div className="relative shrink-0">
                    <img
                      src={spriteUrl(counter.pokemon.dex)}
                      alt={counter.pokemon.speciesName}
                      className="w-12 h-12 drop-shadow-lg"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-600/30 text-yellow-300 font-medium">WB</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs ${TYPE_BG[counter.fastMove.type] ?? ''}`}>
                        {getMoveName(counter.fastMove.moveId, counter.fastMove.name, language)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs ${TYPE_BG[counter.chargedMove.type] ?? ''}`}>
                        {getMoveName(counter.chargedMove.moveId, counter.chargedMove.name, language)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-barGrow"
                          style={{ width: `${(counter.dpsTimesTdo / maxDpsTdo) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs space-y-0.5">
                    <div>
                      <span className="text-slate-500">{t('raids.dps')}: </span>
                      <span className="font-mono font-medium text-orange-400">{counter.dps.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{t('raids.tdo')}: </span>
                      <span className="font-mono font-medium text-blue-400">{counter.tdo.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !boss && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg">
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
