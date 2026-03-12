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
    <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-slate-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white border border-slate-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t('app.title')}</h1>
            <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
        >
          {language === 'en' ? 'DE' : 'EN'}
        </button>
      </div>
    </header>
  );
}
