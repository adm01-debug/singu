import { useCallback, useEffect, useState } from 'react';

export type GlobalDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'singu-global-density-v1';
const CLASS_NAME = 'density-compact';

function readInitial(): GlobalDensity {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

/**
 * Densidade global da UI (cozy vs compact). Aplica `html.density-compact`
 * para que regras CSS reduzam padding/gap em elementos com `[data-density-aware]`.
 * Persistido em localStorage. Independente do toggle do Intelligence Hub.
 */
export function useGlobalDensity() {
  const [density, setDensity] = useState<GlobalDensity>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') root.classList.add(CLASS_NAME);
    else root.classList.remove(CLASS_NAME);
    try {
      window.localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* noop */
    }
  }, [density]);

  const toggle = useCallback(() => {
    setDensity((prev) => (prev === 'compact' ? 'comfortable' : 'compact'));
  }, []);

  return { density, isCompact: density === 'compact', toggle, setDensity };
}
