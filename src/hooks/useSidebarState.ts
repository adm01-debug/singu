import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STATE_KEY = 'relateiq-sidebar-collapsed';

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored === 'true';
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed));
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
  }, []);

  const collapse = useCallback(() => {
    setCollapsed(true);
  }, []);

  return {
    collapsed,
    setCollapsed,
    toggle,
    expand,
    collapse,
  };
}
