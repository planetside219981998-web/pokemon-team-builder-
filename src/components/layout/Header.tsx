import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';

export function Header() {
  const { t, i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const toggleLang = () => {
    const next = language === 'en' ? 'de' : 'en';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-slate-500 flex items-center justify-center shadow-lg shadow-red-500/20 hover:rotate-[360deg] transition-transform duration-500 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-500 shadow-inner" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-sm font-bold transition-all hover:scale-105 border border-slate-600/50"
        >
          {language === 'en' ? 'DE' : 'EN'}
        </button>
      </div>
    </header>
  );
}
