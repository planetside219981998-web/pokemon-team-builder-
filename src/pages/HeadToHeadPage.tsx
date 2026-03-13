import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { getPokemonName } from '@/i18n/pokemonNames';
import { useAppStore } from '@/store/appStore';
import { spriteUrl } from '@/utils/sprites';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { getDefensiveProfile, getWeaknesses, getResistances } from '@/engine/typeChart';
import { db } from '@/data/db';
import type { Pokemon, Move } from '@/data/types';

export function HeadToHeadPage() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [moveMap, setMoveMap] = useState<Map<string, Move>>(new Map());

  useEffect(() => {
    db.moves.toArray().then((moves) => {
      const map = new Map<string, Move>();
      for (const m of moves) map.set(m.moveId, m);
      setMoveMap(map);
    });
  }, []);

  const comparison = useMemo(() => {
    if (!pokemon1 || !pokemon2 || moveMap.size === 0) return null;

    const p1Profile = getDefensiveProfile(pokemon1.types);
    const p2Profile = getDefensiveProfile(pokemon2.types);

    // How effective is P1's STAB against P2?
    let p1VsP2 = 1;
    for (const atkType of pokemon1.types) {
      const mult = p2Profile.get(atkType) ?? 1;
      if (mult > p1VsP2) p1VsP2 = mult;
    }

    // How effective is P2's STAB against P1?
    let p2VsP1 = 1;
    for (const atkType of pokemon2.types) {
      const mult = p1Profile.get(atkType) ?? 1;
      if (mult > p2VsP1) p2VsP1 = mult;
    }

    // Stat comparison
    const statRatio = {
      atk: pokemon1.baseStats.atk / pokemon2.baseStats.atk,
      def: pokemon1.baseStats.def / pokemon2.baseStats.def,
      hp: pokemon1.baseStats.hp / pokemon2.baseStats.hp,
    };

    // Move coverage comparison
    const p1Moves = [...pokemon1.fastMoves, ...pokemon1.chargedMoves].map((id) => moveMap.get(id)).filter(Boolean) as Move[];
    const p2Moves = [...pokemon2.fastMoves, ...pokemon2.chargedMoves].map((id) => moveMap.get(id)).filter(Boolean) as Move[];

    const p1MoveTypes = new Set(p1Moves.map((m) => m.type));
    const p2MoveTypes = new Set(p2Moves.map((m) => m.type));

    // Best move damage P1 -> P2
    let bestP1Damage = 0;
    for (const move of p1Moves) {
      const stab = pokemon1.types.includes(move.type) ? 1.2 : 1;
      let eff = 1;
      for (const defType of pokemon2.types) {
        const profile = getDefensiveProfile([defType]);
        eff *= profile.get(move.type) ?? 1;
      }
      const damage = move.power * stab * eff;
      if (damage > bestP1Damage) bestP1Damage = damage;
    }

    let bestP2Damage = 0;
    for (const move of p2Moves) {
      const stab = pokemon2.types.includes(move.type) ? 1.2 : 1;
      let eff = 1;
      for (const defType of pokemon1.types) {
        const profile = getDefensiveProfile([defType]);
        eff *= profile.get(move.type) ?? 1;
      }
      const damage = move.power * stab * eff;
      if (damage > bestP2Damage) bestP2Damage = damage;
    }

    return { p1VsP2, p2VsP1, statRatio, p1MoveTypes, p2MoveTypes, bestP1Damage, bestP2Damage };
  }, [pokemon1, pokemon2, moveMap]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {t('h2h.title')}
      </h1>

      {/* Pokemon Selection */}
      <div className="grid grid-cols-2 gap-3">
        <PokemonPicker
          label={t('h2h.pokemon1')}
          selected={pokemon1}
          onSelect={setPokemon1}
          language={language}
          accentColor="#ef4444"
        />
        <PokemonPicker
          label={t('h2h.pokemon2')}
          selected={pokemon2}
          onSelect={setPokemon2}
          language={language}
          accentColor="#3b82f6"
        />
      </div>

      {/* VS Display */}
      {pokemon1 && pokemon2 && (
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg animate-slideUp">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-slate-600 z-0">VS</div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Pokemon 1 */}
            <div className="text-center">
              <img src={spriteUrl(pokemon1.dex)} alt="" className="w-20 h-20 mx-auto" />
              <h3 className="font-bold text-white text-sm mt-1">
                {getPokemonName(pokemon1.speciesId, pokemon1.speciesName, language)}
              </h3>
              <div className="flex gap-1 justify-center mt-1">
                {pokemon1.types.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
              </div>
            </div>

            {/* Pokemon 2 */}
            <div className="text-center">
              <img src={spriteUrl(pokemon2.dex)} alt="" className="w-20 h-20 mx-auto" />
              <h3 className="font-bold text-white text-sm mt-1">
                {getPokemonName(pokemon2.speciesId, pokemon2.speciesName, language)}
              </h3>
              <div className="flex gap-1 justify-center mt-1">
                {pokemon2.types.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && pokemon1 && pokemon2 && (
        <div className="space-y-3 animate-slideUp">
          {/* Type Advantage */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg">
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('h2h.typeAdvantage')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <EffectivenessBar label={`→ ${getPokemonName(pokemon2.speciesId, pokemon2.speciesName, language)}`} mult={comparison.p1VsP2} />
              <EffectivenessBar label={`→ ${getPokemonName(pokemon1.speciesId, pokemon1.speciesName, language)}`} mult={comparison.p2VsP1} />
            </div>
          </div>

          {/* Stat Comparison */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg">
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('h2h.stats')}</h3>
            {(['atk', 'def', 'hp'] as const).map((stat) => {
              const v1 = pokemon1.baseStats[stat];
              const v2 = pokemon2.baseStats[stat];
              return (
                <div key={stat} className="flex items-center gap-2 mb-2">
                  <span className="w-20 text-right text-sm font-bold text-white">{v1}</span>
                  <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-slate-700">
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${(v1 / (v1 + v2)) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(v2 / (v1 + v2)) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-left text-sm font-bold text-white">{v2}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>ATK / DEF / HP</span>
            </div>
          </div>

          {/* Weaknesses/Resistances side by side */}
          <div className="grid grid-cols-2 gap-3">
            <TypeInfoCard pokemon={pokemon1} language={language} />
            <TypeInfoCard pokemon={pokemon2} language={language} />
          </div>
        </div>
      )}
    </div>
  );
}

function PokemonPicker({ label, selected, onSelect, language, accentColor }: {
  label: string;
  selected: Pokemon | null;
  onSelect: (p: Pokemon) => void;
  language: string;
  accentColor: string;
}) {
  const { t } = useTranslation();
  const { query, search, results } = usePokemonSearch();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border-2 p-3 shadow-lg"
      style={{ borderColor: selected ? `${accentColor}60` : 'rgb(51 65 85)' }}>
      <label className="text-xs font-medium text-slate-400 block mb-2">{label}</label>
      {selected ? (
        <button onClick={() => { onSelect(null as unknown as Pokemon); setOpen(true); }} className="w-full text-center group">
          <img src={spriteUrl(selected.dex)} alt="" className="w-14 h-14 mx-auto group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-white mt-1">{getPokemonName(selected.speciesId, selected.speciesName, language)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{t('h2h.tapToChange')}</div>
        </button>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { search(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {open && results.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
              {results.slice(0, 15).map((p) => (
                <button
                  key={p.speciesId}
                  onClick={() => { onSelect(p); search(''); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 text-left"
                >
                  <img src={spriteUrl(p.dex)} alt="" className="w-6 h-6" loading="lazy" />
                  <span className="text-xs text-white truncate">{getPokemonName(p.speciesId, p.speciesName, language)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EffectivenessBar({ label, mult }: { label: string; mult: number }) {
  const color = mult >= 1.6 ? 'text-green-400' : mult > 1 ? 'text-yellow-400' : mult < 1 ? 'text-red-400' : 'text-slate-400';
  return (
    <div className="text-center">
      <div className={`text-2xl font-black ${color}`}>{mult.toFixed(2)}x</div>
      <div className="text-[10px] text-slate-500 truncate">{label}</div>
    </div>
  );
}

function TypeInfoCard({ pokemon, language }: { pokemon: Pokemon; language: string }) {
  const weaknesses = getWeaknesses(pokemon.types);
  const resistances = getResistances(pokemon.types);
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-600 p-3 shadow-lg">
      <div className="text-xs font-medium text-slate-400 mb-2">{getPokemonName(pokemon.speciesId, pokemon.speciesName, language)}</div>
      {weaknesses.length > 0 && (
        <div className="mb-2">
          <span className="text-[10px] text-red-400 font-medium">{t('raids.weakTo')}</span>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {weaknesses.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
          </div>
        </div>
      )}
      {resistances.length > 0 && (
        <div>
          <span className="text-[10px] text-green-400 font-medium">{t('raids.resistsLabel')}</span>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {resistances.map((type) => <TypeBadge key={type} type={type} size="sm" />)}
          </div>
        </div>
      )}
    </div>
  );
}
