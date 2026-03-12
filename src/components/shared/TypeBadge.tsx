import { useTranslation } from 'react-i18next';
import type { PokemonType } from '@/data/types';
import { TYPE_HEX } from '@/data/typeColors';

interface TypeBadgeProps {
  type: PokemonType;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'sm' }: TypeBadgeProps) {
  const { t } = useTranslation();
  const hex = TYPE_HEX[type] ?? '#6b7280';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const lightTypes = ['electric', 'ice', 'ground', 'steel'];
  const textColor = lightTypes.includes(type) ? 'text-gray-900' : 'text-white';

  return (
    <span
      className={`${sizeClass} rounded-full font-medium ${textColor} inline-block shadow-sm hover:scale-105 transition-transform`}
      style={{
        background: `linear-gradient(135deg, ${hex}, ${hex}cc)`,
      }}
    >
      {t(`types.${type}`)}
    </span>
  );
}
