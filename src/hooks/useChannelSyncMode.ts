import { useCallback, useState } from 'react';

export type ChannelSyncMode = 'auto' | 'manual';
const KEY = 'channel-sync-mode';

export function useChannelSyncMode() {
  const [mode, setModeState] = useState<ChannelSyncMode>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'manual' || v === 'auto' ? v : 'auto';
    } catch {
      return 'auto';
    }
  });

  const setMode = useCallback((next: ChannelSyncMode) => {
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ChannelSyncMode = prev === 'auto' ? 'manual' : 'auto';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return { mode, setMode, toggle };
}
