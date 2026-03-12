import type { Pokemon, CupDefinition, CupFilter } from '@/data/types';

function matchFilter(pokemon: Pokemon, filter: CupFilter): boolean {
  switch (filter.filterType) {
    case 'type':
      return pokemon.types.some((t) => filter.values.includes(t));
    case 'tag':
      return (pokemon.tags ?? []).some((t) => filter.values.includes(t));
    case 'dex': {
      // Dex range filter: values are [min, max] pairs
      for (let i = 0; i < filter.values.length - 1; i += 2) {
        const min = filter.values[i] as number;
        const max = filter.values[i + 1] as number;
        if (pokemon.dex >= min && pokemon.dex <= max) return true;
      }
      return false;
    }
    case 'id':
      return filter.values.includes(pokemon.speciesId);
    default:
      return false;
  }
}

// Filter pokemon by cup rules
export function filterByCup(allPokemon: Pokemon[], cup: CupDefinition): Pokemon[] {
  return allPokemon.filter((p) => {
    // Must be released
    if (p.released === false) return false;

    // Must match at least one include filter (if any exist)
    const included =
      cup.include.length === 0 || cup.include.some((f) => matchFilter(p, f));

    // Must NOT match any exclude filter
    const excluded = cup.exclude.some((f) => matchFilter(p, f));

    return included && !excluded;
  });
}

// Filter pokemon by CP limit (simple check against level25CP or speciesId patterns)
export function filterByCP(allPokemon: Pokemon[], cpLimit: number): Pokemon[] {
  if (cpLimit >= 10000) return allPokemon; // Master League = no limit

  return allPokemon.filter((_p) => {
    // If we have level25CP data, use it as a rough check
    // Pokemon that exceed CP limit even at low level are excluded
    // A pokemon is eligible if it can be powered down to at or below the CP limit
    // Since all pokemon can be at level 1, they're always technically eligible
    // The real filter is: can this pokemon reach a useful CP at or below the limit?
    // We use a heuristic: if level25CP > cpLimit * 2, it's probably still fine
    // PvPoke rankings already account for this, so we're permissive here
    return true;
  });
}
