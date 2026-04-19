import { useCallback, useEffect, useState } from 'react';

export type IntelDensity = 'compact' | 'comfortable';

const STORAGE_KEY = 'intel-density-v1';

function read(): IntelDensity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

/**
 * Toggle de densidade do Intelligence Hub, persistido em localStorage.
 * Aplica/remove a classe .intel-density-compact no <html> para que regras
 * CSS globais ajustem padding e tipografia dos cards.
 */
export function useIntelDensity() {
  const [density, setDensityState] = useState<IntelDensity>(() => read());

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') root.classList.add('intel-density-compact');
    else root.classList.remove('intel-density-compact');
    return () => { root.classList.remove('intel-density-compact'); };
  }, [density]);

  const setDensity = useCallback((d: IntelDensity) => {
    setDensityState(d);
    try { localStorage.setItem(STORAGE_KEY, d); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setDensityState((prev) => {
      const next: IntelDensity = prev === 'compact' ? 'comfortable' : 'compact';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { density, setDensity, toggle, isCompact: density === 'compact' };
}
