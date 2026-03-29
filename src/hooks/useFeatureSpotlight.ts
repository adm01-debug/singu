import { useState, useCallback, useEffect } from 'react';

const STORAGE_PREFIX = 'singu-spotlight-';

/**
 * Hook for first-time feature tooltips (onboarding contextual).
 * Shows a spotlight once per feature, persists dismissal in localStorage.
 */
export function useFeatureSpotlight(featureId: string) {
  const storageKey = `${STORAGE_PREFIX}${featureId}`;

  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
  }, [storageKey]);

  const reset = useCallback(() => {
    setVisible(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 10000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  return { visible, dismiss, reset };
}
