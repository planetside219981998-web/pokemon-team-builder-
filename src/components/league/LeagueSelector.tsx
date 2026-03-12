import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { db } from '@/data/db';
import type { Format } from '@/data/types';

interface LeagueOption {
  id: string;
  name: string;
  cp: number;
  isActive?: boolean;
}

export function LeagueSelector() {
  const { t } = useTranslation();
  const selectedLeague = useAppStore((s) => s.selectedLeague);
  const selectedCp = useAppStore((s) => s.selectedCp);
  const setLeague = useAppStore((s) => s.setLeague);
  const activeCups = useAppStore((s) => s.activeCups);

  const [leagues, setLeagues] = useState<LeagueOption[]>([]);

  useEffect(() => {
    db.formats.toArray().then((formats: Format[]) => {
      const mainLeagues: LeagueOption[] = [
        { id: 'all', name: t('league.great'), cp: 1500 },
        { id: 'all', name: t('league.ultra'), cp: 2500 },
        { id: 'all', name: t('league.master'), cp: 10000 },
      ];

      const cups: LeagueOption[] = formats
        .filter((f) => f.showCup && f.cup !== 'all')
        .map((f) => ({
          id: f.cup,
          name: f.title,
          cp: f.cp,
          isActive: activeCups.has(f.cup),
        }));

      setLeagues([...mainLeagues, ...cups]);
    });
  }, [t, activeCups]);

  return (
    <div className="mb-4">
      <h2 className="text-sm font-medium text-slate-400 mb-2">{t('league.select')}</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {leagues.map((league, idx) => {
          const isSelected = selectedLeague === league.id && selectedCp === league.cp;
          return (
            <button
              key={`${league.id}-${league.cp}-${idx}`}
              onClick={() => setLeague(league.id, league.cp)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>{league.name}</span>
              {league.isActive && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-400" title={t('league.activeNow')} />
              )}
              <span className="ml-1 text-xs opacity-70">{league.cp < 10000 ? league.cp : '∞'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
