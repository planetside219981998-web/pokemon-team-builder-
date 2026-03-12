import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_HEX } from '@/data/typeColors';

export function TeamDisplay() {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const removeFromTeam = useAppStore((s) => s.removeFromTeam);
  const clearTeam = useAppStore((s) => s.clearTeam);
  const language = useAppStore((s) => s.language);

  const hasAny = team.some((s) => s !== null);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-400">{t('team.title')}</h2>
        {hasAny && (
          <button
            onClick={clearTeam}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {team.map((slot, idx) => {
          const typeColor = slot ? TYPE_HEX[slot.pokemon.types[0] ?? 'normal'] ?? '#475569' : undefined;
          return (
            <div
              key={idx}
              className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                slot
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 shadow-lg'
                  : 'border-dashed border-slate-600 bg-slate-800/30'
              }`}
              style={slot ? { borderColor: `${typeColor}80` } : undefined}
            >
              {slot ? (
                <>
                  <button
                    onClick={() => removeFromTeam(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-700/80 hover:bg-red-600 flex items-center justify-center text-xs transition-colors z-10"
                    title={t('team.removeSlot')}
                  >
                    x
                  </button>
                  <img
                    src={spriteUrl(slot.pokemon.dex)}
                    alt={slot.pokemon.speciesName}
                    className="w-16 h-16 mx-auto -mt-1 drop-shadow-lg"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="text-sm font-bold truncate mt-1">
                    {getPokemonName(slot.pokemon.speciesId, slot.pokemon.speciesName, language)}
                  </div>
                  <div className="flex gap-1 justify-center mt-1">
                    {slot.pokemon.types.map((type) => (
                      <TypeBadge key={type} type={type} size="sm" />
                    ))}
                  </div>
                  {slot.cp && (
                    <div className="mt-1.5 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-700/60 inline-block">
                      CP {slot.cp}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <div className="text-xs text-slate-500">{t('team.emptySlot')}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
