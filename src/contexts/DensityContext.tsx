import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ListDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'singu-table-density';
const STORAGE_EVENT = 'singu:density-change';

const DensityContext = createContext<ListDensity | null>(null);

function readFromStorage(): ListDensity {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

/**
 * Provider opcional para forçar uma densidade em uma subárvore (ex.: páginas
 * cujo modo de visualização é independente do toggle global). Quando ausente,
 * `useListDensity()` faz fallback para `localStorage` (`singu-table-density`)
 * e reage a mudanças cross-tab via `storage` event + evento custom.
 */
export function DensityProvider({
  value,
  children,
}: {
  value: ListDensity;
  children: React.ReactNode;
}) {
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

/**
 * Lê a densidade ambiente — provider > localStorage > 'comfortable'.
 *
 * Útil para componentes "passivos" como o `InfiniteScrollSentinel`, que
 * herdam a preferência sem exigir prop drilling de cada página.
 */
export function useListDensity(): ListDensity {
  const fromContext = useContext(DensityContext);
  const [stored, setStored] = useState<ListDensity>(() =>
    fromContext != null ? fromContext : readFromStorage(),
  );

  useEffect(() => {
    // Provider tem prioridade; ignoramos sincronização de storage neste caso.
    if (fromContext != null) return;
    const sync = () => setStored(readFromStorage());
    window.addEventListener('storage', sync);
    window.addEventListener(STORAGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(STORAGE_EVENT, sync);
    };
  }, [fromContext]);

  return useMemo(() => fromContext ?? stored, [fromContext, stored]);
}

/**
 * Helper para escritores (ex.: `useTableDensity`) notificarem listeners
 * dentro da mesma aba. O `storage` event nativo só dispara entre abas.
 */
export function notifyDensityChange(): void {
  try {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    /* noop em ambientes sem window */
  }
}
