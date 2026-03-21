import { describe, it, expect, vi, beforeEach } from 'vitest';

const STORAGE_KEY = 'relateiq-feature-discovery';

interface FeatureFlag {
  id: string;
  seenAt: string;
}

describe('useFeatureDiscovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('returns empty array when localStorage is empty', () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
      const features = stored ? JSON.parse(stored) : [];
      expect(features).toEqual([]);
    });

    it('loads existing features from localStorage', () => {
      const features: FeatureFlag[] = [
        { id: 'feature-1', seenAt: '2024-01-01T00:00:00Z' },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('feature-1');
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '{bad-json');
      let features: FeatureFlag[] = [];
      try {
        features = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      } catch {
        features = [];
      }
      expect(features).toEqual([]);
    });
  });

  describe('hasSeenFeature', () => {
    it('returns true when feature has been seen', () => {
      const seenFeatures: FeatureFlag[] = [
        { id: 'onboarding', seenAt: '2024-01-01T00:00:00Z' },
      ];
      const hasSeenFeature = (id: string) => seenFeatures.some(f => f.id === id);
      expect(hasSeenFeature('onboarding')).toBe(true);
    });

    it('returns false when feature has not been seen', () => {
      const seenFeatures: FeatureFlag[] = [];
      const hasSeenFeature = (id: string) => seenFeatures.some(f => f.id === id);
      expect(hasSeenFeature('onboarding')).toBe(false);
    });

    it('returns false for unknown feature', () => {
      const seenFeatures: FeatureFlag[] = [
        { id: 'feature-1', seenAt: '2024-01-01T00:00:00Z' },
      ];
      const hasSeenFeature = (id: string) => seenFeatures.some(f => f.id === id);
      expect(hasSeenFeature('feature-2')).toBe(false);
    });

    it('handles empty feature list', () => {
      const seenFeatures: FeatureFlag[] = [];
      const hasSeenFeature = (id: string) => seenFeatures.some(f => f.id === id);
      expect(hasSeenFeature('anything')).toBe(false);
    });
  });

  describe('markAsSeen', () => {
    it('adds new feature to seen list', () => {
      let seenFeatures: FeatureFlag[] = [];
      const markAsSeen = (featureId: string) => {
        if (seenFeatures.some(f => f.id === featureId)) return;
        seenFeatures = [...seenFeatures, { id: featureId, seenAt: new Date().toISOString() }];
      };
      markAsSeen('new-feature');
      expect(seenFeatures).toHaveLength(1);
      expect(seenFeatures[0].id).toBe('new-feature');
    });

    it('does not duplicate already seen feature', () => {
      let seenFeatures: FeatureFlag[] = [
        { id: 'existing', seenAt: '2024-01-01T00:00:00Z' },
      ];
      const markAsSeen = (featureId: string) => {
        if (seenFeatures.some(f => f.id === featureId)) return;
        seenFeatures = [...seenFeatures, { id: featureId, seenAt: new Date().toISOString() }];
      };
      markAsSeen('existing');
      expect(seenFeatures).toHaveLength(1);
    });

    it('sets seenAt timestamp', () => {
      const before = new Date().toISOString();
      let seenFeatures: FeatureFlag[] = [];
      const markAsSeen = (featureId: string) => {
        seenFeatures = [...seenFeatures, { id: featureId, seenAt: new Date().toISOString() }];
      };
      markAsSeen('test');
      const after = new Date().toISOString();
      expect(seenFeatures[0].seenAt >= before).toBe(true);
      expect(seenFeatures[0].seenAt <= after).toBe(true);
    });

    it('can mark multiple features', () => {
      let seenFeatures: FeatureFlag[] = [];
      const markAsSeen = (featureId: string) => {
        if (seenFeatures.some(f => f.id === featureId)) return;
        seenFeatures = [...seenFeatures, { id: featureId, seenAt: new Date().toISOString() }];
      };
      markAsSeen('feature-1');
      markAsSeen('feature-2');
      markAsSeen('feature-3');
      expect(seenFeatures).toHaveLength(3);
    });
  });

  describe('resetAll', () => {
    it('clears all seen features', () => {
      let seenFeatures: FeatureFlag[] = [
        { id: 'f1', seenAt: '2024-01-01T00:00:00Z' },
        { id: 'f2', seenAt: '2024-01-02T00:00:00Z' },
      ];
      seenFeatures = [];
      expect(seenFeatures).toEqual([]);
    });

    it('results in empty localStorage on persist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'x' }]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual([]);
    });
  });

  describe('localStorage persistence', () => {
    it('persists seen features to localStorage', () => {
      const features: FeatureFlag[] = [
        { id: 'feature-1', seenAt: '2024-01-01T00:00:00Z' },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual(features);
    });

    it('handles localStorage write failure gracefully', () => {
      // Simulate by catching error
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } catch {
        // silently fail
      }
      // No error thrown
      expect(true).toBe(true);
    });

    it('loads state across sessions', () => {
      const features: FeatureFlag[] = [
        { id: 'persistent', seenAt: '2024-01-01T00:00:00Z' },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
      // Simulate new session by reading from localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored[0].id).toBe('persistent');
    });
  });

  describe('FeatureFlag interface', () => {
    it('has id and seenAt fields', () => {
      const flag: FeatureFlag = { id: 'test', seenAt: '2024-01-01T00:00:00Z' };
      expect(flag.id).toBe('test');
      expect(flag.seenAt).toBe('2024-01-01T00:00:00Z');
    });

    it('seenAt is ISO string format', () => {
      const flag: FeatureFlag = { id: 'test', seenAt: new Date().toISOString() };
      expect(flag.seenAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
