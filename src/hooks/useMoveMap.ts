import { useState, useEffect } from 'react';
import { db } from '@/data/db';
import type { Move } from '@/data/types';

let cachedMoveMap: Map<string, Move> | null = null;

export function useMoveMap() {
  const [moveMap, setMoveMap] = useState<Map<string, Move>>(cachedMoveMap ?? new Map());

  useEffect(() => {
    if (cachedMoveMap) return;
    db.moves.toArray().then((moves) => {
      const map = new Map<string, Move>();
      for (const m of moves) map.set(m.moveId, m);
      cachedMoveMap = map;
      setMoveMap(map);
    });
  }, []);

  return moveMap;
}
