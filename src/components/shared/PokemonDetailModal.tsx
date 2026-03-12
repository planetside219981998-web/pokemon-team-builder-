import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { spriteUrl } from '@/utils/sprites';
import { TypeBadge } from './TypeBadge';
import { TYPE_HEX } from '@/data/typeColors';
import { getWeaknesses, getResistances, getDefensiveProfile } from '@/engine/typeChart';
import { db } from '@/data/db';
import type { Pokemon, Move } from '@/data/types';

interface Props {
  pokemon: Pokemon;
  onClose: () => void;
}

export function PokemonDetailModal({ pokemon, onClose }: Props) {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const [moveMap, setMoveMap] = useState<Map<string, Move>>(new Map());

  useEffect(() => {
    db.moves.toArray().then((moves) => {
      const map = new Map<string, Move>();
      for (const m of moves) map.set(m.moveId, m);
      setMoveMap(map);
    });
  }, []);

  const weaknesses = useMemo(() => getWeaknesses(pokemon.types), [pokemon.types]);
  const resistances = useMemo(() => getResistances(pokemon.types), [pokemon.types]);
  const defensiveProfile = useMemo(() => getDefensiveProfile(pokemon.types), [pokemon.types]);

  const fastMoves = pokemon.fastMoves.map((id) => moveMap.get(id)).filter(Boolean) as Move[];
  const chargedMoves = pokemon.chargedMoves.map((id) => moveMap.get(id)).filter(Boolean) as Move[];
  const eliteMoves = new Set(pokemon.eliteMoves ?? []);

  const primaryColor = TYPE_HEX[pokemon.types[0] ?? 'normal'] ?? '#475569';
  const totalStats = pokemon.baseStats.atk + pokemon.baseStats.def + pokemon.baseStats.hp;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-700 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ background: `linear-gradient(135deg, ${primaryColor}30, transparent)` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <img src={spriteUrl(pokemon.dex)} alt="" className="w-24 h-24 drop-shadow-lg" />
            <div>
              <div className="text-xs text-slate-400 font-mono">#{String(pokemon.dex).padStart(3, '0')}</div>
              <h2 className="text-xl font-bold text-white">
                {getPokemonName(pokemon.speciesId, pokemon.speciesName, language)}
              </h2>
              <div className="flex gap-1.5 mt-1">
                {pokemon.types.map((type) => <TypeBadge key={type} type={type} size="md" />)}
              </div>
              {pokemon.tags && pokemon.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {pokemon.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-slate-700 text-slate-300 capitalize">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Base Stats */}
        <div className="px-6 py-4 border-t border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">{t('detail.baseStats')}</h3>
          {([
            { key: 'atk', label: 'ATK', color: 'bg-red-500' },
            { key: 'def', label: 'DEF', color: 'bg-blue-500' },
            { key: 'hp', label: 'HP', color: 'bg-green-500' },
          ] as const).map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400 w-8">{label}</span>
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} animate-barGrow`}
                  style={{ width: `${(pokemon.baseStats[key] / 300) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white w-8 text-right">{pokemon.baseStats[key]}</span>
            </div>
          ))}
          <div className="text-xs text-slate-500 mt-1">{t('detail.total')}: {totalStats}</div>
        </div>

        {/* Type Effectiveness */}
        <div className="px-6 py-4 border-t border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">{t('detail.typeEffectiveness')}</h3>
          {weaknesses.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-red-400 font-medium block mb-1">{t('raids.weakTo')}</span>
              <div className="flex flex-wrap gap-1">
                {weaknesses.map((type) => {
                  const mult = defensiveProfile.get(type) ?? 1;
                  return (
                    <span key={type} className="flex items-center gap-0.5">
                      <TypeBadge type={type} size="sm" />
                      <span className="text-[9px] text-red-300 font-bold">{mult.toFixed(2)}x</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {resistances.length > 0 && (
            <div>
              <span className="text-[10px] text-green-400 font-medium block mb-1">{t('raids.resistsLabel')}</span>
              <div className="flex flex-wrap gap-1">
                {resistances.map((type) => {
                  const mult = defensiveProfile.get(type) ?? 1;
                  return (
                    <span key={type} className="flex items-center gap-0.5">
                      <TypeBadge type={type} size="sm" />
                      <span className="text-[9px] text-green-300 font-bold">{mult.toFixed(3)}x</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Moves */}
        {moveMap.size > 0 && (
          <div className="px-6 py-4 border-t border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">{t('detail.moves')}</h3>

            {/* Fast Moves */}
            <div className="mb-3">
              <span className="text-[10px] text-slate-500 font-medium block mb-1">{t('recommendations.fastMove')}</span>
              <div className="space-y-1">
                {fastMoves.map((move) => (
                  <MoveRow key={move.moveId} move={move} isElite={eliteMoves.has(move.moveId)} />
                ))}
              </div>
            </div>

            {/* Charged Moves */}
            <div>
              <span className="text-[10px] text-slate-500 font-medium block mb-1">{t('recommendations.chargedMoves')}</span>
              <div className="space-y-1">
                {chargedMoves.map((move) => (
                  <MoveRow key={move.moveId} move={move} isElite={eliteMoves.has(move.moveId)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Evolution Info */}
        {pokemon.family && (
          <div className="px-6 py-4 border-t border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">{t('detail.family')}</h3>
            <div className="text-xs text-slate-300">
              {pokemon.family.parent && <span>{t('detail.evolvesFrom')}: {pokemon.family.parent}</span>}
              {pokemon.family.evolutions && pokemon.family.evolutions.length > 0 && (
                <span className="block">{t('detail.evolvesTo')}: {pokemon.family.evolutions.join(', ')}</span>
              )}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="px-6 py-4 border-t border-slate-700/50 text-[10px] text-slate-500 space-y-1">
          {pokemon.buddyDistance && <div>{t('detail.buddy')}: {pokemon.buddyDistance}km</div>}
          {pokemon.thirdMoveCost && <div>{t('detail.thirdMove')}: {pokemon.thirdMoveCost.toLocaleString()} Stardust</div>}
        </div>
      </div>
    </div>
  );
}

function MoveRow({ move, isElite }: { move: Move; isElite: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-2 py-1.5">
      <TypeBadge type={move.type} size="sm" />
      <span className="text-xs text-white flex-1">{move.name}</span>
      {isElite && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Elite</span>}
      <span className="text-[10px] text-slate-400">{move.power}pw {move.energy}e</span>
    </div>
  );
}
