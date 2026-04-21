import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'singu:mask-ips';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function write(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: value ? '1' : '0' }));
  } catch {
    /* noop */
  }
}

export function useIPMaskingPreference() {
  const [masked, setMaskedState] = useState<boolean>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMaskedState(e.newValue === '1');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMasked = useCallback((v: boolean) => {
    setMaskedState(v);
    write(v);
  }, []);

  const toggle = useCallback(() => {
    setMaskedState(prev => {
      const next = !prev;
      write(next);
      return next;
    });
  }, []);

  return { masked, toggle, setMasked };
}
