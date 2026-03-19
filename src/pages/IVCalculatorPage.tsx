import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { calculateTopIVs } from '@/engine/ivCalculator';
import { getPokemonName } from '@/i18n/pokemonNames';
import { useAppStore } from '@/store/appStore';
import { spriteUrl } from '@/utils/sprites';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { TYPE_HEX } from '@/data/typeColors';
import { displayTypes } from '@/data/types';
import type { Pokemon } from '@/data/types';

export function IVCalculatorPage() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const { query, search, results } = usePokemonSearch();
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [cpLimit, setCpLimit] = useState(1500);
  const [ivAtk, setIvAtk] = useState(0);
  const [ivDef, setIvDef] = useState(15);
  const [ivHp, setIvHp] = useState(15);
  const [showTop, setShowTop] = useState(25);

  const topIVs = useMemo(() => {
    if (!selectedPokemon) return [];
    return calculateTopIVs(selectedPokemon, cpLimit);
  }, [selectedPokemon, cpLimit]);

  const myRank = useMemo(() => {
    if (!selectedPokemon || topIVs.length === 0) return null;
    return topIVs.find((r) => r.atk === ivAtk && r.def === ivDef && r.hp === ivHp) ?? null;
  }, [topIVs, ivAtk, ivDef, ivHp, selectedPokemon]);

  const bestStat = topIVs[0]?.statProduct ?? 1;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {t('iv.title')}
      </h1>

      {/* Pokemon Search */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg">
        <div className="relative">
          <input
            type="text"
            value={selectedPokemon ? getPokemonName(selectedPokemon.speciesId, selectedPokemon.speciesName, language) : query}
            onChange={(e) => {
              setSelectedPokemon(null);
              search(e.target.value);
            }}
            placeholder={t('iv.searchPokemon')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          {!selectedPokemon && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
              {results.slice(0, 20).map((p) => (
                <button
                  key={p.speciesId}
                  onClick={() => { setSelectedPokemon(p); search(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
                >
                  <img src={spriteUrl(p.dex)} alt="" className="w-8 h-8" loading="lazy" />
                  <span className="text-sm text-white">{getPokemonName(p.speciesId, p.speciesName, language)}</span>
                  <span className="ml-auto flex gap-1">
                    {displayTypes(p.types).map((type) => <TypeBadge key={type} type={type} size="sm" />)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CP Limit Selector */}
        <div className="flex gap-2 mt-3">
          {[500, 1500, 2500].map((cp) => (
            <button
              key={cp}
              onClick={() => setCpLimit(cp)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                cpLimit === cp
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {cp === 500 ? t('iv.little') : cp === 1500 ? t('iv.great') : t('iv.ultra')}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Pokemon + IV Input */}
      {selectedPokemon && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg animate-slideUp"
          style={{ borderColor: `${TYPE_HEX[selectedPokemon.types[0] ?? 'normal'] ?? '#475569'}40` }}>
          <div className="flex items-center gap-4 mb-4">
            <img src={spriteUrl(selectedPokemon.dex)} alt="" className="w-16 h-16" />
            <div>
              <h2 className="text-lg font-bold text-white">
                {getPokemonName(selectedPokemon.speciesId, selectedPokemon.speciesName, language)}
              </h2>
              <div className="flex gap-1 mt-1">
                {displayTypes(selectedPokemon.types).map((type) => <TypeBadge key={type} type={type} size="sm" />)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Base: {selectedPokemon.baseStats.atk}/{selectedPokemon.baseStats.def}/{selectedPokemon.baseStats.hp}
              </div>
            </div>
          </div>

          {/* IV Sliders */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'ATK', value: ivAtk, setter: setIvAtk, color: 'text-red-400' },
              { label: 'DEF', value: ivDef, setter: setIvDef, color: 'text-blue-400' },
              { label: 'HP', value: ivHp, setter: setIvHp, color: 'text-green-400' },
            ].map(({ label, value, setter, color }) => (
              <div key={label} className="text-center">
                <label className={`text-xs font-bold ${color}`}>{label}</label>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={value}
                  onChange={(e) => setter(parseInt(e.target.value))}
                  className="w-full mt-1 accent-cyan-500"
                />
                <div className="text-lg font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* My IV Result */}
          {myRank && (
            <div className={`p-4 rounded-xl border-2 ${
              myRank.rank <= 10 ? 'border-yellow-500 bg-yellow-900/20' :
              myRank.rank <= 100 ? 'border-green-500 bg-green-900/20' :
              myRank.rank <= 500 ? 'border-blue-500 bg-blue-900/20' :
              'border-slate-600 bg-slate-700/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-black text-white">#{myRank.rank}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  myRank.percentile >= 99 ? 'bg-yellow-500 text-black' :
                  myRank.percentile >= 95 ? 'bg-green-500 text-black' :
                  myRank.percentile >= 80 ? 'bg-blue-500 text-white' :
                  'bg-slate-600 text-white'
                }`}>
                  {t('iv.top')} {(100 - myRank.percentile + (100/4096)).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-400">CP: <span className="text-white font-bold">{myRank.cp}</span></div>
                <div className="text-slate-400">{t('iv.level')}: <span className="text-white font-bold">{myRank.level}</span></div>
                <div className="text-slate-400">{t('iv.statProduct')}: <span className="text-white font-bold">{myRank.statProduct.toFixed(0)}</span></div>
                <div className="text-slate-400">{t('iv.ofBest')}: <span className="text-white font-bold">{((myRank.statProduct / bestStat) * 100).toFixed(2)}%</span></div>
              </div>
              {/* Stat bars */}
              <div className="mt-3 space-y-1">
                <StatLine label="ATK" value={myRank.atkStat} color="bg-red-500" />
                <StatLine label="DEF" value={myRank.defStat} color="bg-blue-500" />
                <StatLine label="HP" value={myRank.hpStat} color="bg-green-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top IVs Table */}
      {selectedPokemon && topIVs.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg">
          <h2 className="text-sm font-medium text-slate-400 mb-3">{t('iv.topRanks')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="py-2 px-1 text-left">#</th>
                  <th className="py-2 px-1 text-center">ATK</th>
                  <th className="py-2 px-1 text-center">DEF</th>
                  <th className="py-2 px-1 text-center">HP</th>
                  <th className="py-2 px-1 text-center">CP</th>
                  <th className="py-2 px-1 text-center">{t('iv.level')}</th>
                  <th className="py-2 px-1 text-right">{t('iv.statProduct')}</th>
                </tr>
              </thead>
              <tbody>
                {topIVs.slice(0, showTop).map((iv) => {
                  const isMyIV = iv.atk === ivAtk && iv.def === ivDef && iv.hp === ivHp;
                  return (
                    <tr
                      key={`${iv.atk}-${iv.def}-${iv.hp}`}
                      className={`border-b border-slate-800 ${isMyIV ? 'bg-cyan-900/30 font-bold' : 'hover:bg-slate-700/30'}`}
                      onClick={() => { setIvAtk(iv.atk); setIvDef(iv.def); setIvHp(iv.hp); }}
                    >
                      <td className={`py-1.5 px-1 ${iv.rank <= 3 ? 'text-yellow-400' : iv.rank <= 10 ? 'text-green-400' : 'text-slate-400'}`}>
                        {iv.rank}
                      </td>
                      <td className="py-1.5 px-1 text-center text-red-300">{iv.atk}</td>
                      <td className="py-1.5 px-1 text-center text-blue-300">{iv.def}</td>
                      <td className="py-1.5 px-1 text-center text-green-300">{iv.hp}</td>
                      <td className="py-1.5 px-1 text-center text-white">{iv.cp}</td>
                      <td className="py-1.5 px-1 text-center text-slate-300">{iv.level}</td>
                      <td className="py-1.5 px-1 text-right text-slate-300">{iv.statProduct.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showTop < topIVs.length && (
            <button
              onClick={() => setShowTop((s) => Math.min(s + 50, 100))}
              className="w-full mt-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {t('iv.showMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatLine({ label, value, color }: { label: string; value: number; color: string }) {
  const maxWidth = 300; // rough max stat value for scaling
  const pct = Math.min((value / maxWidth) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-6">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} animate-barGrow`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-300 w-12 text-right">{value.toFixed(1)}</span>
    </div>
  );
}
