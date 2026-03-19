import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';

export function Header() {
  const { t, i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [spinning, setSpinning] = useState(false);

  const toggleLang = () => {
    const next = language === 'en' ? 'de' : 'en';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handlePokeballClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/50" style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 27, 75, 0.97) 50%, rgba(15, 23, 42, 0.97) 100%)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Subtle top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Pokeball */}
          <button
            onClick={handlePokeballClick}
            className="relative w-10 h-10 shrink-0 group"
            aria-label="Pokeball"
          >
            <div className={`w-10 h-10 rounded-full border-[2.5px] border-slate-400 overflow-hidden shadow-lg transition-transform duration-500 ${spinning ? 'pokeball-spin' : 'group-hover:rotate-12'}`}
              style={{ boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)' }}
            >
              {/* Top half - red */}
              <div className="h-[45%] bg-gradient-to-br from-red-500 to-red-600" />
              {/* Center band */}
              <div className="h-[10%] bg-slate-400 relative flex items-center justify-center">
                <div className="absolute w-4 h-4 rounded-full bg-white border-[2px] border-slate-400 shadow-md z-10" />
              </div>
              {/* Bottom half - white */}
              <div className="h-[45%] bg-gradient-to-br from-white to-slate-100" />
            </div>
          </button>

          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                Pokemon GO
              </span>
              <span className="text-white ml-1.5">
                {t('app.titleShort', 'Team Builder')}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 tracking-wide">{t('app.subtitle')}</p>
          </div>
        </div>

        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105 border focus-ring"
          style={{
            background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.8), rgba(30, 41, 59, 0.8))',
            borderColor: 'rgba(100, 116, 139, 0.4)',
          }}
        >
          <span className="bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
            {language === 'en' ? 'DE' : 'EN'}
          </span>
        </button>
      </div>
    </header>
  );
}
