import { useState, useCallback, useEffect, useMemo } from 'react';

export interface SearchPreset {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
  usageCount?: number;
  lastUsedAt?: string;
}

export type PresetSortMode = 'favoritos' | 'mais-usados' | 'recentes' | 'alfabetica';

const STORAGE_KEY = 'relateiq-search-presets';
const SORT_KEY = 'relateiq-search-presets-sort';

const VALID_SORT_MODES: PresetSortMode[] = ['favoritos', 'mais-usados', 'recentes', 'alfabetica'];

function dateDesc(a?: string, b?: string): number {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return ta - tb;
}

export function comparePresets(a: SearchPreset, b: SearchPreset, mode: PresetSortMode): number {
  // Favoritos sempre primeiro (em todos os modos)
  const af = a.isFavorite ?? false;
  const bf = b.isFavorite ?? false;
  if (af !== bf) return af ? -1 : 1;

  switch (mode) {
    case 'mais-usados': {
      const diff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      if (diff !== 0) return diff;
      return dateDesc(b.createdAt, a.createdAt);
    }
    case 'recentes':
      return dateDesc(b.createdAt, a.createdAt);
    case 'alfabetica':
      return a.name.localeCompare(b.name, 'pt-BR');
    case 'favoritos':
    default:
      return dateDesc(b.lastUsedAt ?? b.createdAt, a.lastUsedAt ?? a.createdAt);
  }
}

/**
 * Hook for managing saved search filter presets
 * Persists to localStorage for cross-session use
 */
export function useSearchPresets(context: string = 'contacts') {
  const storageKey = `${STORAGE_KEY}-${context}`;
  const sortStorageKey = `${SORT_KEY}-${context}`;

  const [presets, setPresets] = useState<SearchPreset[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [sortMode, setSortModeState] = useState<PresetSortMode>(() => {
    try {
      const stored = localStorage.getItem(sortStorageKey);
      return stored && (VALID_SORT_MODES as string[]).includes(stored)
        ? (stored as PresetSortMode)
        : 'favoritos';
    } catch {
      return 'favoritos';
    }
  });

  // Persist presets
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets));
    } catch {
      // silently fail
    }
  }, [presets, storageKey]);

  // Persist sort mode
  useEffect(() => {
    try {
      localStorage.setItem(sortStorageKey, sortMode);
    } catch {
      // silently fail
    }
  }, [sortMode, sortStorageKey]);

  const setSortMode = useCallback((mode: PresetSortMode) => {
    setSortModeState(mode);
  }, []);

  const savePreset = useCallback((preset: Omit<SearchPreset, 'id' | 'createdAt'>) => {
    const newPreset: SearchPreset = {
      ...preset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPresets(prev => [newPreset, ...prev].slice(0, 10)); // max 10 presets
    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePreset = useCallback((id: string, updates: Partial<Omit<SearchPreset, 'id' | 'createdAt'>>) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPresets(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: !(p.isFavorite ?? false) } : p
    ));
  }, []);

  const markAsUsed = useCallback((id: string) => {
    setPresets(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            usageCount: (p.usageCount ?? 0) + 1,
            lastUsedAt: new Date().toISOString(),
          }
        : p
    ));
  }, []);

  /**
   * Importa presets em lote. Respeita limite de 10 e faz dedup de nomes.
   * Retorna contagem de adicionados e ignorados (por limite).
   */
  const importPresets = useCallback((items: Array<Omit<SearchPreset, 'id' | 'createdAt'>>): { added: number; skipped: number } => {
    let added = 0;
    let skipped = 0;
    setPresets(prev => {
      const next = [...prev];
      const existingNames = new Set(next.map(p => p.name));
      for (const item of items) {
        if (next.length >= 10) {
          skipped++;
          continue;
        }
        let finalName = item.name;
        if (existingNames.has(finalName)) {
          let i = 2;
          while (existingNames.has(`${item.name} (${i})`)) i++;
          finalName = `${item.name} (${i})`;
        }
        const newPreset: SearchPreset = {
          ...item,
          name: finalName,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        next.unshift(newPreset);
        existingNames.add(finalName);
        added++;
      }
      return next.slice(0, 10);
    });
    return { added, skipped };
  }, []);

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => comparePresets(a, b, sortMode)),
    [presets, sortMode]
  );

  return {
    presets,
    sortedPresets,
    sortMode,
    setSortMode,
    savePreset,
    deletePreset,
    updatePreset,
    toggleFavorite,
    markAsUsed,
    importPresets,
  };
}
