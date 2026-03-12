import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pokemon, RankedPokemon, SyncStatus, TeamSlot } from '@/data/types';

interface AppState {
  // Language
  language: 'en' | 'de';
  setLanguage: (lang: 'en' | 'de') => void;

  // League selection
  selectedLeague: string;
  selectedCp: number;
  setLeague: (league: string, cp: number) => void;

  // Team
  team: (TeamSlot | null)[];
  addToTeam: (pokemon: Pokemon, ranking?: RankedPokemon, cp?: number) => void;
  removeFromTeam: (index: number) => void;
  clearTeam: () => void;

  // Sync status
  syncStatus: SyncStatus;
  syncMessage: string;
  setSyncStatus: (status: SyncStatus, message: string) => void;

  // Active cups (admin toggle)
  activeCups: Set<string>;
  toggleCup: (cupName: string) => void;
  setActiveCups: (cups: string[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => {
        localStorage.setItem('language', lang);
        set({ language: lang });
      },

      selectedLeague: 'all',
      selectedCp: 1500,
      setLeague: (league, cp) => set({ selectedLeague: league, selectedCp: cp, team: [null, null, null] }),

      team: [null, null, null],
      addToTeam: (pokemon, ranking, cp) =>
        set((state) => {
          const team = [...state.team];
          const emptyIdx = team.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            team[emptyIdx] = { pokemon, ranking, cp };
          }
          return { team };
        }),
      removeFromTeam: (index) =>
        set((state) => {
          const team = [...state.team];
          team[index] = null;
          return { team };
        }),
      clearTeam: () => set({ team: [null, null, null] }),

      syncStatus: 'idle',
      syncMessage: '',
      setSyncStatus: (status, message) => set({ syncStatus: status, syncMessage: message }),

      activeCups: new Set<string>(),
      toggleCup: (cupName) =>
        set((state) => {
          const cups = new Set(state.activeCups);
          if (cups.has(cupName)) {
            cups.delete(cupName);
          } else {
            cups.add(cupName);
          }
          return { activeCups: cups };
        }),
      setActiveCups: (cups) => set({ activeCups: new Set(cups) }),
    }),
    {
      name: 'pokemon-team-builder',
      partialize: (state) => ({
        language: state.language,
        selectedLeague: state.selectedLeague,
        selectedCp: state.selectedCp,
        activeCups: Array.from(state.activeCups),
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...(p ?? {}),
          activeCups: new Set((p?.activeCups as string[]) ?? []),
        };
      },
    }
  )
);
