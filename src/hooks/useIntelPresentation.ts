import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'intel-pres-v1';

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Modo "presentation" do Intelligence Hub: oculta status bar/telemetria,
 * aumenta tipografia e simplifica a UI. Persistido em localStorage.
 * Aplica/remove a classe global .intel-presentation no <html>.
 */
export function useIntelPresentation() {
  const [active, setActive] = useState<boolean>(() => read());

  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add('intel-presentation');
    else root.classList.remove('intel-presentation');
    return () => {
      root.classList.remove('intel-presentation');
    };
  }, [active]);

  const toggle = useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { active, toggle };
}
