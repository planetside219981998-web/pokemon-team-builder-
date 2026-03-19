import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_HEX } from '@/data/typeColors';
import { displayTypes } from '@/data/types';

export function TeamDisplay() {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const removeFromTeam = useAppStore((s) => s.removeFromTeam);
  const clearTeam = useAppStore((s) => s.clearTeam);
  const language = useAppStore((s) => s.language);

  const hasAny = team.some((s) => s !== null);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('team.title')}
        </h2>
        {hasAny && (
          <button
            onClick={clearTeam}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {team.map((slot, idx) => {
          const typeColor = slot ? TYPE_HEX[slot.pokemon.types[0] ?? 'normal'] ?? '#475569' : undefined;
          return (
            <div
              key={idx}
              className={`relative rounded-2xl p-3 text-center transition-all duration-300 ${
                slot
                  ? 'border-2 shadow-lg animate-scaleIn'
                  : 'border-2 border-dashed border-slate-600/50 hover:border-slate-500/50'
              }`}
              style={slot ? {
                borderColor: `${typeColor}60`,
                background: `linear-gradient(160deg, ${typeColor}15, rgba(15, 23, 42, 0.95) 60%)`,
                boxShadow: `0 4px 24px ${typeColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
              } : {
                background: 'linear-gradient(160deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
              }}
            >
              {slot ? (
                <>
                  <button
                    onClick={() => removeFromTeam(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-800/90 text-slate-400 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs transition-all z-10 hover:scale-110"
                    title={t('team.removeSlot')}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Pokemon sprite with glow */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ backgroundColor: typeColor }} />
                    <img
                      src={spriteUrl(slot.pokemon.dex)}
                      alt={slot.pokemon.speciesName}
                      className="w-16 h-16 mx-auto -mt-1 drop-shadow-lg relative z-[1] hover:scale-110 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  <div className="text-sm font-bold truncate mt-1.5">
                    {getPokemonName(slot.pokemon.speciesId, slot.pokemon.speciesName, language)}
                  </div>
                  <div className="flex gap-1 justify-center mt-1.5">
                    {displayTypes(slot.pokemon.types).map((type) => (
                      <TypeBadge key={type} type={type} size="sm" />
                    ))}
                  </div>
                  {slot.cp && (
                    <div className="mt-2 text-xs font-mono px-2.5 py-0.5 rounded-full inline-block" style={{
                      background: `${typeColor}20`,
                      color: typeColor,
                      border: `1px solid ${typeColor}30`,
                    }}>
                      CP {slot.cp}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-5">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.3), rgba(30, 41, 59, 0.5))',
                    border: '2px dashed rgba(100, 116, 139, 0.3)',
                  }}>
                    <svg className="w-6 h-6 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{t('team.emptySlot')}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Slot {idx + 1}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
