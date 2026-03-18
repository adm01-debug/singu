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
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

  return { presets, savePreset, deletePreset, updatePreset };
}
