import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/data/db';
import { searchPokemonByName } from '@/i18n/pokemonNames';
import type { Pokemon } from '@/data/types';

export function usePokemonSearch() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pokemon[]>([]);

  // Load all pokemon from DB once
  useEffect(() => {
    db.pokemon.toArray().then(setAllPokemon);
  }, []);

  // Minimal search index for name matching
  const searchIndex = useMemo(
    () => allPokemon.map((p) => ({ speciesId: p.speciesId, speciesName: p.speciesName })),
    [allPokemon]
  );

  // Pokemon map for fast lookup
  const pokemonMap = useMemo(() => {
    const map = new Map<string, Pokemon>();
    for (const p of allPokemon) map.set(p.speciesId, p);
    return map;
  }, [allPokemon]);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const matchIds = searchPokemonByName(q, searchIndex);
      const matched = matchIds
        .map((id) => pokemonMap.get(id))
        .filter((p): p is Pokemon => p !== undefined);
      setResults(matched);
    },
    [searchIndex, pokemonMap]
  );

  return { query, search, results, allPokemon, pokemonMap };
}
