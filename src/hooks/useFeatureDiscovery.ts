import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'relateiq-feature-discovery';

interface FeatureFlag {
  id: string;
  seenAt: string;
}

/**
 * Hook to manage feature discovery state
 * Tracks which features the user has seen/dismissed
 */
export function useFeatureDiscovery() {
  const [seenFeatures, setSeenFeatures] = useState<FeatureFlag[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_err) {
      // localStorage unavailable
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenFeatures));
    } catch (_err) {
      // localStorage unavailable
    }
  }, [seenFeatures]);

  const hasSeenFeature = useCallback((featureId: string) => {
    return seenFeatures.some(f => f.id === featureId);
  }, [seenFeatures]);

  const markAsSeen = useCallback((featureId: string) => {
    setSeenFeatures(prev => {
      if (prev.some(f => f.id === featureId)) return prev;
      return [...prev, { id: featureId, seenAt: new Date().toISOString() }];
    });
  }, []);

  const resetAll = useCallback(() => {
    setSeenFeatures([]);
  }, []);

  return { hasSeenFeature, markAsSeen, resetAll };
}
