import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { TypeBadge } from '@/components/shared/TypeBadge';

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
        {team.map((slot, idx) => (
          <div
            key={idx}
            className={`relative rounded-xl border-2 p-3 text-center transition-all ${
              slot
                ? 'border-red-500/50 bg-slate-800'
                : 'border-dashed border-slate-600 bg-slate-800/50'
            }`}
          >
            {slot ? (
              <>
                <button
                  onClick={() => removeFromTeam(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-700 hover:bg-red-600 flex items-center justify-center text-xs transition-colors"
                  title={t('team.removeSlot')}
                >
                  x
                </button>
                <div className="text-2xl mb-1">
                  #{slot.pokemon.dex}
                </div>
                <div className="text-sm font-medium truncate">
                  {getPokemonName(slot.pokemon.speciesId, slot.pokemon.speciesName, language)}
                </div>
                <div className="flex gap-1 justify-center mt-1">
                  {slot.pokemon.types.map((type) => (
                    <TypeBadge key={type} type={type} size="sm" />
                  ))}
                </div>
                {slot.cp && (
                  <div className="mt-1 text-xs font-mono text-slate-400">
                    {t('team.cpLabel')}: {slot.cp}
                  </div>
                )}
              </>
            ) : (
              <div className="py-4">
                <div className="text-2xl text-slate-600 mb-1">?</div>
                <div className="text-xs text-slate-500">{t('team.slot', { n: idx + 1 })}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
