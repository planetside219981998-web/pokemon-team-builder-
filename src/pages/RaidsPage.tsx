import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db } from '@/data/db';
import { getRaidCounters, type RaidCounter } from '@/engine/raidScorer';
import { getPokemonName } from '@/i18n/pokemonNames';
import { getMoveName } from '@/i18n/moveNames';
import { PokemonSearch } from '@/components/search/PokemonSearch';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Pokemon, PokemonType } from '@/data/types';

const WEATHER_OPTIONS = [
  'noWeather', 'sunny', 'rainy', 'partlyCloudy', 'cloudy', 'windy', 'snow', 'fog',
] as const;

const FRIEND_OPTIONS = [
  'none', 'good', 'great', 'ultra', 'best',
] as const;

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('raids.title')}</h1>

      {/* Boss selection */}
      {isDataReady && (
        <div>
          <label className="text-sm font-medium text-slate-400 block mb-2">{t('raids.selectBoss')}</label>
          {boss ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
              <span className="text-xl font-mono text-slate-500">#{boss.dex}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {getPokemonName(boss.speciesId, boss.speciesName, language)}
                </h3>
                <div className="flex gap-1 mt-1">
                  {boss.types.map((type) => (
                    <TypeBadge key={type} type={type} />
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
          ) : (
            <PokemonSearch onSelect={handleSelectBoss} />
          )}
        </div>
      )}

      {/* Filters */}
      {boss && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Weather */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
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

          {/* Friend boost */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
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
            {counters.map((counter, idx) => (
              <div
                key={`${counter.pokemon.speciesId}-${idx}`}
                className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3 flex items-center gap-3"
              >
                <span className="text-lg font-bold text-slate-500 w-8 shrink-0">#{idx + 1}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">
                      {getPokemonName(counter.pokemon.speciesId, counter.pokemon.speciesName, language)}
                    </h3>
                    {counter.weatherBoosted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-600/30 text-yellow-300">WB</span>
                    )}
                  </div>

                  {/* Moves */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded border text-xs ${TYPE_BG[counter.fastMove.type] ?? ''}`}>
                      {getMoveName(counter.fastMove.moveId, counter.fastMove.name, language)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded border text-xs ${TYPE_BG[counter.chargedMove.type] ?? ''}`}>
                      {getMoveName(counter.chargedMove.moveId, counter.chargedMove.name, language)}
                    </span>
                  </div>

                  {/* DPS bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${(counter.dpsTimesTdo / maxDpsTdo) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
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
            ))}
          </div>
        </div>
      )}

      {!loading && !boss && (
        <div className="text-center py-8 text-slate-400">
          <p>{t('raids.noCounters')}</p>
        </div>
      )}
    </div>
  );
}
