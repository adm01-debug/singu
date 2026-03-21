import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the hapticPatterns object and the hook logic by extracting patterns
// Since we can't use renderHook, we test the pattern definitions and logic paths

describe('useHapticFeedback', () => {
  describe('hapticPatterns', () => {
    // Import the module to test its internal patterns via the hook
    let useHapticFeedback: typeof import('../useHapticFeedback').useHapticFeedback;
    let useButtonHaptic: typeof import('../useHapticFeedback').useButtonHaptic;

    beforeEach(async () => {
      vi.resetModules();
      // Mock React hooks for non-renderHook testing
      vi.mock('react', async () => {
        const actual = await vi.importActual('react');
        return {
          ...actual as object,
          useCallback: (fn: Function) => fn,
        };
      });
      const mod = await import('../useHapticFeedback');
      useHapticFeedback = mod.useHapticFeedback;
      useButtonHaptic = mod.useButtonHaptic;
    });

    it('exports useHapticFeedback function', () => {
      expect(typeof useHapticFeedback).toBe('function');
    });

    it('exports useButtonHaptic function', () => {
      expect(typeof useButtonHaptic).toBe('function');
    });

    it('returns isSupported property', () => {
      const result = useHapticFeedback();
      expect(typeof result.isSupported).toBe('boolean');
    });

    it('returns vibrate function', () => {
      const result = useHapticFeedback();
      expect(typeof result.vibrate).toBe('function');
    });

    it('returns all pattern shortcut methods', () => {
      const result = useHapticFeedback();
      expect(typeof result.light).toBe('function');
      expect(typeof result.medium).toBe('function');
      expect(typeof result.heavy).toBe('function');
      expect(typeof result.success).toBe('function');
      expect(typeof result.warning).toBe('function');
      expect(typeof result.error).toBe('function');
      expect(typeof result.selection).toBe('function');
    });

    it('returns cancel function', () => {
      const result = useHapticFeedback();
      expect(typeof result.cancel).toBe('function');
    });

    it('vibrate returns false when not supported', () => {
      // navigator.vibrate is not available in jsdom
      const result = useHapticFeedback();
      expect(result.isSupported).toBe(false);
      expect(result.vibrate('light')).toBe(false);
    });

    it('light returns false when not supported', () => {
      const result = useHapticFeedback();
      expect(result.light()).toBe(false);
    });

    it('cancel does not throw when not supported', () => {
      const result = useHapticFeedback();
      expect(() => result.cancel()).not.toThrow();
    });

    it('vibrate with custom number pattern returns false when unsupported', () => {
      const result = useHapticFeedback();
      expect(result.vibrate(100)).toBe(false);
    });

    it('vibrate with custom array pattern returns false when unsupported', () => {
      const result = useHapticFeedback();
      expect(result.vibrate([10, 20, 30])).toBe(false);
    });

    describe('when vibrate is supported', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'vibrate', {
          value: vi.fn(() => true),
          writable: true,
          configurable: true,
        });
      });

      it('detects support', () => {
        const result = useHapticFeedback();
        expect(result.isSupported).toBe(true);
      });

      it('vibrate calls navigator.vibrate with light pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('light');
        expect(navigator.vibrate).toHaveBeenCalledWith(10);
      });

      it('vibrate calls navigator.vibrate with medium pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('medium');
        expect(navigator.vibrate).toHaveBeenCalledWith(25);
      });

      it('vibrate calls navigator.vibrate with heavy pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('heavy');
        expect(navigator.vibrate).toHaveBeenCalledWith(50);
      });

      it('vibrate calls navigator.vibrate with success pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('success');
        expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
      });

      it('vibrate calls navigator.vibrate with warning pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('warning');
        expect(navigator.vibrate).toHaveBeenCalledWith([25, 25, 25]);
      });

      it('vibrate calls navigator.vibrate with error pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('error');
        expect(navigator.vibrate).toHaveBeenCalledWith([50, 25, 50, 25, 50]);
      });

      it('vibrate calls navigator.vibrate with selection pattern', () => {
        const result = useHapticFeedback();
        result.vibrate('selection');
        expect(navigator.vibrate).toHaveBeenCalledWith(5);
      });

      it('vibrate with custom number calls navigator.vibrate directly', () => {
        const result = useHapticFeedback();
        result.vibrate(200);
        expect(navigator.vibrate).toHaveBeenCalledWith(200);
      });

      it('cancel calls navigator.vibrate with 0', () => {
        const result = useHapticFeedback();
        result.cancel();
        expect(navigator.vibrate).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('useButtonHaptic', () => {
    let useButtonHaptic: typeof import('../useHapticFeedback').useButtonHaptic;

    beforeEach(async () => {
      vi.resetModules();
      vi.mock('react', async () => {
        const actual = await vi.importActual('react');
        return {
          ...actual as object,
          useCallback: (fn: Function) => fn,
        };
      });
      const mod = await import('../useHapticFeedback');
      useButtonHaptic = mod.useButtonHaptic;
    });

    it('returns onPress function', () => {
      const result = useButtonHaptic();
      expect(typeof result.onPress).toBe('function');
    });

    it('returns onLongPress function', () => {
      const result = useButtonHaptic();
      expect(typeof result.onLongPress).toBe('function');
    });

    it('onPress does not throw when vibrate not supported', () => {
      const result = useButtonHaptic();
      expect(() => result.onPress()).not.toThrow();
    });

    it('onLongPress does not throw when vibrate not supported', () => {
      const result = useButtonHaptic();
      expect(() => result.onLongPress()).not.toThrow();
    });
  });
});
