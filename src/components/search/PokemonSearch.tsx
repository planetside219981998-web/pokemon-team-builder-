import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { spriteUrl } from '@/utils/sprites';
import type { Pokemon } from '@/data/types';

interface PokemonSearchProps {
  onSelect: (pokemon: Pokemon, cp?: number) => void;
  disabled?: boolean;
}

export function PokemonSearch({ onSelect, disabled }: PokemonSearchProps) {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const selectedCp = useAppStore((s) => s.selectedCp);
  const { query, search, results } = usePokemonSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [cpInput, setCpInput] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePickFromList = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    search('');
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (!selectedPokemon) return;
    const cp = cpInput ? parseInt(cpInput, 10) : undefined;
    onSelect(selectedPokemon, cp);
    setSelectedPokemon(null);
    setCpInput('');
  };

  const handleCancel = () => {
    setSelectedPokemon(null);
    setCpInput('');
  };

  const cpNum = cpInput ? parseInt(cpInput, 10) : 0;
  const cpExceeded = cpNum > 0 && selectedCp < 10000 && cpNum > selectedCp;

  if (selectedPokemon) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-600 p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={spriteUrl(selectedPokemon.dex)}
            alt={selectedPokemon.speciesName}
            className="w-12 h-12 drop-shadow-lg"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <span className="font-bold text-lg">
              {getPokemonName(selectedPokemon.speciesId, selectedPokemon.speciesName, language)}
            </span>
            <div className="flex gap-1 mt-0.5">
              {selectedPokemon.types.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={cpInput}
            onChange={(e) => setCpInput(e.target.value)}
            placeholder={t('team.cpPlaceholder')}
            min={10}
            max={10000}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !cpExceeded) handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            onClick={handleConfirm}
            disabled={cpExceeded}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {t('recommendations.addToTeam')}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
          >
            x
          </button>
        </div>
        {cpExceeded && (
          <p className="text-xs text-red-400 mt-2">
            {t('team.cpExceeded', { limit: selectedCp })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            search(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          disabled={disabled}
          placeholder={t('search.placeholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/80 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-40 mt-1 w-full max-h-72 overflow-y-auto rounded-xl bg-slate-800 border border-slate-600 shadow-2xl"
        >
          {results.map((pokemon) => (
            <button
              key={pokemon.speciesId}
              onClick={() => handlePickFromList(pokemon)}
              className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-700 transition-colors text-left"
            >
              <img
                src={spriteUrl(pokemon.dex)}
                alt={pokemon.speciesName}
                className="w-8 h-8 shrink-0"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {getPokemonName(pokemon.speciesId, pokemon.speciesName, language)}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {language === 'de' ? pokemon.speciesName : getPokemonName(pokemon.speciesId, pokemon.speciesName, 'de')}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {pokemon.types.map((type) => (
                  <TypeBadge key={type} type={type} size="sm" />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute z-40 mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-sm text-slate-400">
          {t('search.noResults')}
        </div>
      )}
    </div>
  );
}
