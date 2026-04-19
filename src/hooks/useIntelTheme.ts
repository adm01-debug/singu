import { useCallback, useEffect, useState } from 'react';

export type IntelTheme = 'cyan' | 'amber';
const STORAGE_KEY = 'intel-theme-v1';
const CLASS_PREFIX = 'intel-theme-';

function read(): IntelTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'amber' ? 'amber' : 'cyan';
  } catch {
    return 'cyan';
  }
}

function applyClass(theme: IntelTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(`${CLASS_PREFIX}cyan`, `${CLASS_PREFIX}amber`);
  root.classList.add(`${CLASS_PREFIX}${theme}`);
}

/**
 * Tema alternativo do Intelligence Hub — alterna acentos cyan ↔ âmbar.
 * Persiste em localStorage e aplica classe no <html>.
 */
export function useIntelTheme() {
  const [theme, setTheme] = useState<IntelTheme>(() => read());

  useEffect(() => {
    applyClass(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: IntelTheme = prev === 'cyan' ? 'amber' : 'cyan';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const set = useCallback((next: IntelTheme) => {
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  return { theme, toggle, set };
}
