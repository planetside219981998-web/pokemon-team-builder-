import { useState, useEffect, useCallback } from 'react';
import { db, getRankings } from '@/data/db';
import { ensureRankings } from '@/data/sync';
import { getRecommendations } from '@/engine';
import { useAppStore } from '@/store/appStore';
import type { Pokemon, Move, RankedPokemon, CupDefinition, Recommendation } from '@/data/types';

export function useTeamBuilder() {
  const team = useAppStore((s) => s.team);
  const selectedLeague = useAppStore((s) => s.selectedLeague);
  const selectedCp = useAppStore((s) => s.selectedCp);
  const language = useAppStore((s) => s.language);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeRecommendations = useCallback(async () => {
    const teamPokemon = team.filter((s) => s !== null).map((s) => s.pokemon);
    if (teamPokemon.length === 0) {
      setRecommendations([]);
      return;
    }

    // Don't recommend if team is already full
    if (teamPokemon.length >= 3) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure rankings are loaded for this league
      await ensureRankings(selectedLeague, selectedCp);

      // Load data from DB
      const [allPokemon, allMoves, rankings, cupDef] = await Promise.all([
        db.pokemon.toArray(),
        db.moves.toArray(),
        getRankings(selectedLeague, selectedCp),
        db.cups.get(selectedLeague) as Promise<CupDefinition | undefined>,
      ]);

      // Build move map
      const moveMap = new Map<string, Move>();
      for (const m of allMoves) moveMap.set(m.moveId, m);

      // Get recommendations
      const recs = getRecommendations(
        teamPokemon,
        rankings as RankedPokemon[],
        allPokemon,
        moveMap,
        cupDef,
        { maxResults: 15, beginnerFriendly: true, locale: language as 'en' | 'de' }
      );

      setRecommendations(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [team, selectedLeague, selectedCp, language]);

  useEffect(() => {
    computeRecommendations();
  }, [computeRecommendations]);

  return { recommendations, loading, error };
}
