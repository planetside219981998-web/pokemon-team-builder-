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
      <h2 className="text-sm font-semibold text-slate-300 mb-2.5 flex items-center gap-2">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {t('league.select')}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {leagues.map((league, idx) => {
          const isSelected = selectedLeague === league.id && selectedCp === league.cp;
          return (
            <button
              key={`${league.id}-${league.cp}-${idx}`}
              onClick={() => setLeague(league.id, league.cp)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'text-white shadow-lg hover:scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={isSelected ? {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
              } : {
                background: 'rgba(51, 65, 85, 0.3)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
              }}
            >
              <span>{league.name}</span>
              {league.isActive && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" title={t('league.activeNow')} />
              )}
              <span className="ml-1.5 text-xs opacity-60">{league.cp < 10000 ? league.cp : ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
