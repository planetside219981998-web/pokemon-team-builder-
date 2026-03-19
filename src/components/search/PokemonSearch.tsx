import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { useAppStore } from '@/store/appStore';
import { getPokemonName } from '@/i18n/pokemonNames';
import { TypeBadge } from '@/components/shared/TypeBadge';
import { spriteUrl } from '@/utils/sprites';
import { TYPE_HEX } from '@/data/typeColors';
import { displayTypes } from '@/data/types';
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
    const typeColor = TYPE_HEX[selectedPokemon.types[0] ?? 'normal'] ?? '#475569';
    return (
      <div className="glass-card rounded-2xl p-4 animate-scaleIn" style={{
        borderColor: `${typeColor}30`,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-lg opacity-40" style={{ backgroundColor: typeColor }} />
            <img
              src={spriteUrl(selectedPokemon.dex)}
              alt={selectedPokemon.speciesName}
              className="w-14 h-14 drop-shadow-lg relative z-[1]"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <span className="font-bold text-lg">
              {getPokemonName(selectedPokemon.speciesId, selectedPokemon.speciesName, language)}
            </span>
            <div className="flex gap-1 mt-1">
              {displayTypes(selectedPokemon.types).map((type) => (
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
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !cpExceeded) handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            onClick={handleConfirm}
            disabled={cpExceeded}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            {t('recommendations.addToTeam')}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-sm transition-colors hover:bg-slate-600/50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {cpExceeded && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {t('team.cpExceeded', { limit: selectedCp })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative group">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-800/60 border border-slate-600/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 disabled:opacity-50 transition-all"
          style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)' }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-40 mt-2 w-full max-h-80 overflow-y-auto rounded-2xl shadow-2xl animate-slideDown"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {results.map((pokemon) => (
            <button
              key={pokemon.speciesId}
              onClick={() => handlePickFromList(pokemon)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl"
            >
              <img
                src={spriteUrl(pokemon.dex)}
                alt={pokemon.speciesName}
                className="w-9 h-9 shrink-0 drop-shadow-md"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {getPokemonName(pokemon.speciesId, pokemon.speciesName, language)}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {language === 'de' ? pokemon.speciesName : getPokemonName(pokemon.speciesId, pokemon.speciesName, 'de')}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {displayTypes(pokemon.types).map((type) => (
                  <TypeBadge key={type} type={type} size="sm" />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl px-4 py-4 text-sm text-slate-400 text-center" style={{
          background: 'rgba(30, 41, 59, 0.98)',
          border: '1px solid rgba(71, 85, 105, 0.4)',
        }}>
          {t('search.noResults')}
        </div>
      )}
    </div>
  );
}
