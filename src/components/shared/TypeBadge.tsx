import { useTranslation } from 'react-i18next';
import type { PokemonType } from '@/data/types';

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-[#A8A77A]',
  fire: 'bg-[#EE8130]',
  water: 'bg-[#6390F0]',
  electric: 'bg-[#F7D02C] text-gray-900',
  grass: 'bg-[#7AC74C]',
  ice: 'bg-[#96D9D6] text-gray-900',
  fighting: 'bg-[#C22E28]',
  poison: 'bg-[#A33EA1]',
  ground: 'bg-[#E2BF65] text-gray-900',
  flying: 'bg-[#A98FF3]',
  psychic: 'bg-[#F95587]',
  bug: 'bg-[#A6B91A]',
  rock: 'bg-[#B6A136]',
  ghost: 'bg-[#735797]',
  dragon: 'bg-[#6F35FC]',
  dark: 'bg-[#705746]',
  steel: 'bg-[#B7B7CE] text-gray-900',
  fairy: 'bg-[#D685AD]',
};

interface TypeBadgeProps {
  type: PokemonType;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'sm' }: TypeBadgeProps) {
  const { t } = useTranslation();
  const colorClass = TYPE_COLORS[type] ?? 'bg-gray-500';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${colorClass} ${sizeClass} rounded-full font-medium text-white inline-block`}>
      {t(`types.${type}`)}
    </span>
  );
}
