import { useCallback, useEffect, useState } from 'react';

export type BookmarkType = 'contact' | 'company' | 'deal';

export interface EntityBookmark {
  type: BookmarkType;
  id: string;
  name: string;
  pinnedAt: number;
}

const STORAGE_KEY = 'intel-bookmarks-v1';
const MAX = 10;

function read(): EntityBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EntityBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: EntityBookmark[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX))); } catch { /* ignore */ }
}

/**
 * Bookmarks de entidades persistidos em localStorage (máx 10).
 * Sincroniza entre abas via evento 'storage'.
 */
export function useEntityBookmarks() {
  const [items, setItems] = useState<EntityBookmark[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPinned = useCallback(
    (type: BookmarkType, id: string) => items.some((b) => b.type === type && b.id === id),
    [items]
  );

  const toggle = useCallback((entry: Omit<EntityBookmark, 'pinnedAt'>) => {
    setItems((prev) => {
      const exists = prev.find((b) => b.type === entry.type && b.id === entry.id);
      const next = exists
        ? prev.filter((b) => !(b.type === entry.type && b.id === entry.id))
        : [{ ...entry, pinnedAt: Date.now() }, ...prev].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((type: BookmarkType, id: string) => {
    setItems((prev) => {
      const next = prev.filter((b) => !(b.type === type && b.id === id));
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => { write([]); setItems([]); }, []);

  return { items, isPinned, toggle, remove, clear, max: MAX };
}
