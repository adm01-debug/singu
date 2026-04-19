import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'intel-tour-v1';
const VERSION = 1;

interface StoredTour {
  v: number;
  completed: boolean;
  completedAt?: number;
}

function read(): StoredTour {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: VERSION, completed: false };
    const parsed = JSON.parse(raw) as Partial<StoredTour>;
    if (parsed.v !== VERSION) return { v: VERSION, completed: false };
    return { v: VERSION, completed: !!parsed.completed, completedAt: parsed.completedAt };
  } catch {
    return { v: VERSION, completed: false };
  }
}

function write(state: StoredTour): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/**
 * Persistência simples do estado do tour de onboarding do Intelligence Hub.
 */
export function useIntelTour() {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<boolean>(() => read().completed);

  useEffect(() => {
    const state = read();
    if (!state.completed) setOpen(true);
  }, []);

  const complete = useCallback(() => {
    const state: StoredTour = { v: VERSION, completed: true, completedAt: Date.now() };
    write(state);
    setCompleted(true);
    setOpen(false);
  }, []);

  const reopen = useCallback(() => setOpen(true), []);

  const reset = useCallback(() => {
    write({ v: VERSION, completed: false });
    setCompleted(false);
    setOpen(true);
  }, []);

  return { open, completed, complete, reopen, reset, setOpen };
}
