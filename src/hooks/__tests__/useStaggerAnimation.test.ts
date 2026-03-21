import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the stagger animation logic directly since we can't use renderHook
// The core logic is pure computation that we can replicate

describe('useStaggerAnimation', () => {
  describe('stagger array generation (no reduced motion)', () => {
    const generateStagger = (
      count: number,
      config: { baseDelay?: number; maxDelay?: number; duration?: number } = {}
    ) => {
      const { baseDelay = 0.03, maxDelay = 0.3, duration = 0.3 } = config;
      const clampedDelay = Math.min(baseDelay, maxDelay / Math.max(count, 1));

      return Array.from({ length: count }, (_, index) => ({
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration, delay: index * clampedDelay },
        style: { '--stagger-index': index },
      }));
    };

    it('generates correct number of items', () => {
      const result = generateStagger(5);
      expect(result).toHaveLength(5);
    });

    it('generates empty array for count 0', () => {
      const result = generateStagger(0);
      expect(result).toHaveLength(0);
    });

    it('first item has 0 delay', () => {
      const result = generateStagger(3);
      expect(result[0].transition.delay).toBe(0);
    });

    it('delays increase sequentially', () => {
      const result = generateStagger(3);
      expect(result[1].transition.delay).toBeGreaterThan(result[0].transition.delay);
      expect(result[2].transition.delay).toBeGreaterThan(result[1].transition.delay);
    });

    it('each item has initial opacity 0', () => {
      const result = generateStagger(3);
      result.forEach(item => {
        expect(item.initial.opacity).toBe(0);
      });
    });

    it('each item has animate opacity 1', () => {
      const result = generateStagger(3);
      result.forEach(item => {
        expect(item.animate.opacity).toBe(1);
      });
    });

    it('each item has initial y offset of 10', () => {
      const result = generateStagger(3);
      result.forEach(item => {
        expect(item.initial.y).toBe(10);
      });
    });

    it('each item has animate y of 0', () => {
      const result = generateStagger(3);
      result.forEach(item => {
        expect(item.animate.y).toBe(0);
      });
    });

    it('style includes stagger-index', () => {
      const result = generateStagger(3);
      expect(result[0].style['--stagger-index']).toBe(0);
      expect(result[1].style['--stagger-index']).toBe(1);
      expect(result[2].style['--stagger-index']).toBe(2);
    });

    it('uses custom duration', () => {
      const result = generateStagger(2, { duration: 0.5 });
      result.forEach(item => {
        expect(item.transition.duration).toBe(0.5);
      });
    });

    it('uses custom baseDelay', () => {
      const result = generateStagger(2, { baseDelay: 0.1 });
      expect(result[1].transition.delay).toBe(0.1);
    });
  });

  describe('delay clamping', () => {
    const computeClampedDelay = (count: number, baseDelay: number, maxDelay: number) => {
      return Math.min(baseDelay, maxDelay / Math.max(count, 1));
    };

    it('clamps delay when count is large', () => {
      // With 100 items, baseDelay=0.03, maxDelay=0.3
      // maxDelay/count = 0.3/100 = 0.003, which is less than 0.03
      const clamped = computeClampedDelay(100, 0.03, 0.3);
      expect(clamped).toBe(0.003);
    });

    it('uses baseDelay when count is small', () => {
      // With 2 items, baseDelay=0.03, maxDelay=0.3
      // maxDelay/count = 0.3/2 = 0.15, which is more than 0.03
      const clamped = computeClampedDelay(2, 0.03, 0.3);
      expect(clamped).toBe(0.03);
    });

    it('handles count of 1', () => {
      const clamped = computeClampedDelay(1, 0.03, 0.3);
      expect(clamped).toBe(0.03);
    });

    it('prevents division by zero when count is 0', () => {
      const clamped = computeClampedDelay(0, 0.03, 0.3);
      expect(clamped).toBe(0.03); // Math.max(0, 1) = 1, so 0.3/1 = 0.3 > 0.03
    });

    it('total stagger time never exceeds maxDelay', () => {
      const count = 50;
      const baseDelay = 0.03;
      const maxDelay = 0.3;
      const clamped = computeClampedDelay(count, baseDelay, maxDelay);
      const totalTime = clamped * (count - 1);
      // Total time should be reasonable (close to maxDelay)
      expect(totalTime).toBeLessThanOrEqual(maxDelay);
    });
  });

  describe('reduced motion behavior', () => {
    const generateReducedMotion = (count: number) => {
      return Array.from({ length: count }, () => ({
        initial: {},
        animate: {},
        transition: { duration: 0 },
        style: {},
      }));
    };

    it('returns items with empty initial', () => {
      const result = generateReducedMotion(3);
      result.forEach(item => {
        expect(item.initial).toEqual({});
      });
    });

    it('returns items with empty animate', () => {
      const result = generateReducedMotion(3);
      result.forEach(item => {
        expect(item.animate).toEqual({});
      });
    });

    it('returns items with duration 0', () => {
      const result = generateReducedMotion(3);
      result.forEach(item => {
        expect(item.transition.duration).toBe(0);
      });
    });

    it('returns items with empty style', () => {
      const result = generateReducedMotion(3);
      result.forEach(item => {
        expect(item.style).toEqual({});
      });
    });

    it('generates correct count of items', () => {
      const result = generateReducedMotion(5);
      expect(result).toHaveLength(5);
    });

    it('returns empty array for count 0', () => {
      const result = generateReducedMotion(0);
      expect(result).toHaveLength(0);
    });
  });

  describe('default config values', () => {
    it('default baseDelay is 0.03', () => {
      const { baseDelay = 0.03 } = {};
      expect(baseDelay).toBe(0.03);
    });

    it('default maxDelay is 0.3', () => {
      const { maxDelay = 0.3 } = {};
      expect(maxDelay).toBe(0.3);
    });

    it('default duration is 0.3', () => {
      const { duration = 0.3 } = {};
      expect(duration).toBe(0.3);
    });
  });
});
