import { useState, useCallback, useEffect } from 'react';

export interface SearchPreset {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  createdAt: string;
}

const STORAGE_KEY = 'relateiq-search-presets';

/**
 * Hook for managing saved search filter presets
 * Persists to localStorage for cross-session use
 */
export function useSearchPresets(context: string = 'contacts') {
  const storageKey = `${STORAGE_KEY}-${context}`;
  const [presets, setPresets] = useState<SearchPreset[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets));
    } catch {
      // silently fail
    }
  }, [presets, storageKey]);

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

  return { presets, savePreset, deletePreset, updatePreset, importPresets };
}
