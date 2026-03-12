import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import type { SavedTeam } from '@/store/appStore';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_HEX } from '@/data/typeColors';

export function TeamSaveLoad() {
  const { t } = useTranslation();
  const team = useAppStore((s) => s.team);
  const savedTeams = useAppStore((s) => s.savedTeams);
  const saveTeam = useAppStore((s) => s.saveTeam);
  const deleteSavedTeam = useAppStore((s) => s.deleteSavedTeam);
  const setLeague = useAppStore((s) => s.setLeague);
  const addToTeam = useAppStore((s) => s.addToTeam);
  const clearTeam = useAppStore((s) => s.clearTeam);

  const [teamName, setTeamName] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  const filledSlots = team.filter((s) => s !== null);

  const handleSave = () => {
    if (filledSlots.length === 0) return;
    const name = teamName.trim() || `Team ${savedTeams.length + 1}`;
    saveTeam(name);
    setTeamName('');
  };

  const handleLoad = (saved: SavedTeam) => {
    setLeague(saved.league, saved.cp);
    clearTeam();
    for (const slot of saved.slots) {
      addToTeam(
        { speciesId: slot.speciesId, speciesName: slot.speciesName, dex: slot.dex, types: slot.types, fastMoves: [], chargedMoves: [], baseStats: { atk: 0, def: 0, hp: 0 } },
        undefined,
        slot.cp
      );
    }
  };

  const handleShare = () => {
    const filled = team.filter((s) => s !== null);
    if (filled.length === 0) return;
    const ids = filled.map((s) => s!.pokemon.speciesId).join(',');
    const league = useAppStore.getState().selectedLeague;
    const cp = useAppStore.getState().selectedCp;
    const url = `${window.location.origin}${window.location.pathname}?team=${encodeURIComponent(ids)}&league=${league}&cp=${cp}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      {/* Save & Share row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={t('team.teamName')}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={filledSlots.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {t('team.save')}
        </button>
        <button
          onClick={handleShare}
          disabled={filledSlots.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {copied ? t('team.copied') : t('team.share')}
        </button>
      </div>

      {/* Saved teams toggle */}
      {savedTeams.length > 0 && (
        <button
          onClick={() => setShowSaved(!showSaved)}
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className={`w-4 h-4 transition-transform ${showSaved ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('team.savedTeams')} ({savedTeams.length})
        </button>
      )}

      {/* Saved teams list */}
      {showSaved && savedTeams.length > 0 && (
        <div className="space-y-2 animate-slideUp">
          {[...savedTeams].reverse().map((saved, revIdx) => {
            const realIdx = savedTeams.length - 1 - revIdx;
            return (
              <div
                key={saved.savedAt}
                className="flex items-center gap-3 bg-gradient-to-r from-slate-800/80 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-3 shadow-md"
              >
                {/* Sprites */}
                <div className="flex -space-x-2">
                  {saved.slots.map((slot) => (
                    <img
                      key={slot.speciesId}
                      src={spriteUrl(slot.dex)}
                      alt={slot.speciesName}
                      className="w-10 h-10 rounded-full border-2 bg-slate-700"
                      style={{ borderColor: TYPE_HEX[slot.types[0] ?? 'normal'] ?? '#6b7280' }}
                      loading="lazy"
                    />
                  ))}
                </div>

                {/* Name & meta */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{saved.name}</div>
                  <div className="text-xs text-slate-400">
                    {saved.league === 'all' ? 'Open' : saved.league} &middot; {saved.cp} CP
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleLoad(saved)}
                  className="px-3 py-1.5 bg-green-600/80 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {t('team.load')}
                </button>
                <button
                  onClick={() => deleteSavedTeam(realIdx)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title={t('team.removeSlot')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
