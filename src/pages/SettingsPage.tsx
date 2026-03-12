import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db, getMeta } from '@/data/db';
import { syncData } from '@/data/sync';
import type { Format } from '@/data/types';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const activeCups = useAppStore((s) => s.activeCups);
  const toggleCup = useAppStore((s) => s.toggleCup);

  const [lastSync, setLastSync] = useState<string>('');
  const [cups, setCups] = useState<Format[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getMeta('lastSync').then((v) => setLastSync(v ?? ''));
    db.formats.toArray().then((formats) => {
      setCups(formats.filter((f) => f.showCup && f.cup !== 'all'));
    });
  }, []);

  const handleLangChange = (lang: 'en' | 'de') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear commit SHA to force re-download
    await db.meta.delete('commitSha');
    await syncData((status, message) => setSyncStatus(status, message));
    const syncTime = await getMeta('lastSync');
    setLastSync(syncTime ?? '');
    setRefreshing(false);
  };

  const handleClearCache = async () => {
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Language */}
      <section className="bg-slate-800 rounded-xl p-4">
        <h2 className="font-medium mb-3">{t('settings.language')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              language === 'en' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLangChange('de')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              language === 'de' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Deutsch
          </button>
        </div>
      </section>

      {/* Active Cups */}
      <section className="bg-slate-800 rounded-xl p-4">
        <h2 className="font-medium mb-1">{t('settings.activeCups')}</h2>
        <p className="text-xs text-slate-400 mb-3">{t('settings.activeCupsDesc')}</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cups.map((cup) => (
            <label
              key={cup.cup}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={activeCups.has(cup.cup)}
                onChange={() => toggleCup(cup.cup)}
                className="w-4 h-4 rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-700"
              />
              <div className="flex-1">
                <span className="text-sm">{cup.title}</span>
                <span className="text-xs text-slate-400 ml-2">CP {cup.cp}</span>
              </div>
              {activeCups.has(cup.cup) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/30 text-green-400">
                  {t('league.activeNow')}
                </span>
              )}
            </label>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-slate-800 rounded-xl p-4">
        <h2 className="font-medium mb-3">{t('settings.dataManagement')}</h2>
        {lastSync && (
          <p className="text-xs text-slate-400 mb-3">
            {t('settings.lastSync', { date: new Date(lastSync).toLocaleString() })}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {refreshing ? '...' : t('settings.refreshData')}
          </button>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-red-600 text-sm font-medium transition-colors"
          >
            {t('settings.clearCache')}
          </button>
        </div>
      </section>

      {/* About */}
      <section className="bg-slate-800 rounded-xl p-4">
        <h2 className="font-medium mb-2">{t('settings.about')}</h2>
        <p className="text-sm text-slate-400">{t('settings.aboutText')}</p>
      </section>
    </div>
  );
}
