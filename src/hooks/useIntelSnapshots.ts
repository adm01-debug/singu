import { useCallback, useEffect, useState } from 'react';
import {
  encodeSnapshot,
  pushRecentSnapshot,
  readRecentSnapshots,
  type IntelSnapshotPayload,
  type RecentSnapshot,
} from '@/lib/intelSnapshot';

/**
 * Gerencia snapshots locais do Intelligence Hub (máx 5).
 * Cria snapshot a partir de um payload e mantém histórico em localStorage.
 */
export function useIntelSnapshots() {
  const [items, setItems] = useState<RecentSnapshot[]>(() => readRecentSnapshots());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'intel-snapshots-v1') setItems(readRecentSnapshots());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const create = useCallback((payload: IntelSnapshotPayload, label: string) => {
    const hash = encodeSnapshot(payload);
    const next = pushRecentSnapshot({ label, hash });
    setItems(next);
    return hash;
  }, []);

  return { items, create };
}
