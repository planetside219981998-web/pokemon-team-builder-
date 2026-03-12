import dePokemon from './locales/de/pokemon.json';

const deNames = dePokemon as Record<string, string>;

// Reverse map: German name (lowercase) -> speciesId
const deToId = new Map<string, string>();
for (const [id, name] of Object.entries(deNames)) {
  deToId.set(name.toLowerCase(), id);
}

// Get display name for a pokemon in the given locale
export function getPokemonName(speciesId: string, speciesName: string, locale: string): string {
  if (locale === 'de') {
    return deNames[speciesId] ?? speciesName;
  }
  return speciesName;
}

// Search pokemon by name in both languages. Returns matching speciesIds.
export function searchPokemonByName(
  query: string,
  allPokemon: { speciesId: string; speciesName: string }[]
): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matches: { speciesId: string; priority: number }[] = [];

  for (const p of allPokemon) {
    const enName = p.speciesName.toLowerCase();
    const deName = (deNames[p.speciesId] ?? '').toLowerCase();

    // Exact match = highest priority
    if (enName === q || deName === q) {
      matches.push({ speciesId: p.speciesId, priority: 0 });
      continue;
    }

    // Prefix match
    if (enName.startsWith(q) || deName.startsWith(q)) {
      matches.push({ speciesId: p.speciesId, priority: 1 });
      continue;
    }

    // Contains match
    if (enName.includes(q) || deName.includes(q)) {
      matches.push({ speciesId: p.speciesId, priority: 2 });
    }
  }

  return matches
    .sort((a, b) => a.priority - b.priority)
    .map((m) => m.speciesId)
    .slice(0, 15);
}
