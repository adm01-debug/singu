import { useCallback, useSyncExternalStore } from 'react';

const SIDEBAR_STATE_KEY = 'relateiq-sidebar-collapsed';
const SIDEBAR_EVENT = 'relateiq-sidebar-state-change';

function getSnapshot() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
}

function getServerSnapshot() {
  return false;
}

function notifySubscribers() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STATE_KEY) callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SIDEBAR_EVENT, callback);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
}

export function useSidebarState() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof window === 'undefined') return;

    const prev = getSnapshot();
    const next = typeof value === 'function' ? value(prev) : value;

    localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
    notifySubscribers();
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, [setCollapsed]);

  const expand = useCallback(() => {
    setCollapsed(false);
  }, [setCollapsed]);

  const collapse = useCallback(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  return {
    collapsed,
    setCollapsed,
    toggle,
    expand,
    collapse,
  };
}
