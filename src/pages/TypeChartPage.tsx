import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_TYPES } from '@/data/types';
import type { PokemonType } from '@/data/types';
import { getTypeEffectiveness } from '@/engine/typeChart';
import { TYPE_HEX } from '@/data/typeColors';
import { TypeBadge } from '@/components/shared/TypeBadge';

const SUPER = 1.6;
const RESIST = 0.625;
const IMMUNE = 0.390625;

export function TypeChartPage() {
  const { t } = useTranslation();
  const [selectedAtk, setSelectedAtk] = useState<PokemonType | null>(null);
  const [selectedDef, setSelectedDef] = useState<PokemonType | null>(null);

  const getColor = (mult: number) => {
    if (mult >= SUPER) return 'bg-green-600 text-white';
    if (mult <= IMMUNE) return 'bg-gray-800 text-gray-500';
    if (mult <= RESIST) return 'bg-red-800/70 text-red-300';
    return 'bg-slate-700/50 text-slate-500';
  };

  const getLabel = (mult: number) => {
    if (mult >= SUPER) return `${mult.toFixed(1)}x`;
    if (mult <= IMMUNE) return `${mult.toFixed(2)}x`;
    if (mult <= RESIST) return `${mult.toFixed(2)}x`;
    return '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        {t('typeChart.title')}
      </h1>

      {/* Interactive type selector */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg">
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-400 block mb-2">{t('typeChart.attacking')}</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedAtk(selectedAtk === type ? null : type)}
                className={`transition-all ${selectedAtk === type ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
              >
                <TypeBadge type={type} size="sm" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-2">{t('typeChart.defending')}</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedDef(selectedDef === type ? null : type)}
                className={`transition-all ${selectedDef === type ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
              >
                <TypeBadge type={type} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {selectedAtk && selectedDef && (
          <div className="mt-4 p-3 rounded-lg bg-slate-700/50 text-center animate-slideUp">
            <div className="flex items-center justify-center gap-3">
              <TypeBadge type={selectedAtk} size="md" />
              <span className="text-slate-400 text-lg">→</span>
              <TypeBadge type={selectedDef} size="md" />
              <span className="text-slate-400 text-lg">=</span>
              <span className={`text-2xl font-bold ${getTypeEffectiveness(selectedAtk, selectedDef) >= SUPER ? 'text-green-400' : getTypeEffectiveness(selectedAtk, selectedDef) < 1 ? 'text-red-400' : 'text-slate-300'}`}>
                {getTypeEffectiveness(selectedAtk, selectedDef).toFixed(3)}x
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full matrix */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-xl border border-slate-700 p-4 shadow-lg overflow-x-auto">
        <h2 className="text-sm font-medium text-slate-400 mb-3">{t('typeChart.matrix')}</h2>
        <div className="min-w-[700px]">
          <table className="w-full text-[9px]">
            <thead>
              <tr>
                <th className="p-1 text-left text-slate-500 w-16">
                  <span className="text-[8px]">ATK ↓ / DEF →</span>
                </th>
                {ALL_TYPES.map((type) => (
                  <th key={type} className="p-0.5 text-center">
                    <div
                      className="w-6 h-6 rounded-md mx-auto flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: TYPE_HEX[type] }}
                      title={t(`types.${type}`)}
                    >
                      {t(`types.${type}`).slice(0, 2).toUpperCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_TYPES.map((atkType) => (
                <tr key={atkType} className="hover:bg-slate-700/30">
                  <td className="p-1">
                    <div
                      className="w-full h-5 rounded-md flex items-center justify-center text-white font-bold text-[8px]"
                      style={{ backgroundColor: TYPE_HEX[atkType] }}
                    >
                      {t(`types.${atkType}`).slice(0, 3).toUpperCase()}
                    </div>
                  </td>
                  {ALL_TYPES.map((defType) => {
                    const mult = getTypeEffectiveness(atkType, defType);
                    const isHighlighted =
                      (selectedAtk === atkType && selectedDef === defType) ||
                      (selectedAtk === atkType && !selectedDef) ||
                      (!selectedAtk && selectedDef === defType);
                    return (
                      <td
                        key={defType}
                        className={`p-0.5 text-center ${isHighlighted ? 'ring-1 ring-yellow-400' : ''}`}
                      >
                        <div
                          className={`w-6 h-5 rounded-sm mx-auto flex items-center justify-center text-[8px] font-bold ${getColor(mult)}`}
                        >
                          {getLabel(mult)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 rounded-sm bg-green-600 inline-block" /> {t('typeChart.superEffective')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 rounded-sm bg-red-800/70 inline-block" /> {t('typeChart.notVeryEffective')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 rounded-sm bg-gray-800 inline-block" /> {t('typeChart.immune')}
          </span>
        </div>
      </div>
    </div>
  );
}
