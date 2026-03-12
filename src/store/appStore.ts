import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pokemon, PokemonType, RankedPokemon, SyncStatus, TeamSlot } from '@/data/types';

export interface SavedTeam {
  name: string;
  league: string;
  cp: number;
  slots: Array<{ speciesId: string; speciesName: string; dex: number; types: PokemonType[]; cp?: number }>;
  savedAt: number;
}

interface AppState {
  language: 'en' | 'de';
  setLanguage: (lang: 'en' | 'de') => void;

  selectedLeague: string;
  selectedCp: number;
  setLeague: (league: string, cp: number) => void;

  team: (TeamSlot | null)[];
  addToTeam: (pokemon: Pokemon, ranking?: RankedPokemon, cp?: number) => void;
  removeFromTeam: (index: number) => void;
  clearTeam: () => void;

  savedTeams: SavedTeam[];
  saveTeam: (name: string) => void;
  deleteSavedTeam: (index: number) => void;

  syncStatus: SyncStatus;
  syncMessage: string;
  setSyncStatus: (status: SyncStatus, message: string) => void;

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

      savedTeams: [],
      saveTeam: (name) =>
        set((state) => {
          const filledSlots = state.team
            .filter((s) => s !== null)
            .map((s) => ({
              speciesId: s!.pokemon.speciesId,
              speciesName: s!.pokemon.speciesName,
              dex: s!.pokemon.dex,
              types: s!.pokemon.types,
              cp: s!.cp,
            }));
          if (filledSlots.length === 0) return {};
          const saved: SavedTeam = {
            name,
            league: state.selectedLeague,
            cp: state.selectedCp,
            slots: filledSlots,
            savedAt: Date.now(),
          };
          return { savedTeams: [...state.savedTeams.slice(-19), saved] };
        }),
      deleteSavedTeam: (index) =>
        set((state) => ({
          savedTeams: state.savedTeams.filter((_, i) => i !== index),
        })),

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
        savedTeams: state.savedTeams,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...(p ?? {}),
          activeCups: new Set((p?.activeCups as string[]) ?? []),
          savedTeams: (p?.savedTeams as SavedTeam[]) ?? [],
        };
      },
    }
  )
);
