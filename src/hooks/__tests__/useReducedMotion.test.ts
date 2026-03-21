import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMotionSafeVariants } from '../useReducedMotion';

describe('getMotionSafeVariants', () => {
  describe('when prefersReducedMotion is true', () => {
    it('returns static variants with opacity 1', () => {
      const variants = getMotionSafeVariants(true);
      expect(variants).toHaveProperty('initial');
      expect(variants).toHaveProperty('animate');
      expect(variants).toHaveProperty('exit');
    });

    it('initial has opacity 1', () => {
      const variants = getMotionSafeVariants(true);
      expect(variants.initial).toEqual({ opacity: 1 });
    });

    it('animate has opacity 1', () => {
      const variants = getMotionSafeVariants(true);
      expect(variants.animate).toEqual({ opacity: 1 });
    });

    it('exit has opacity 1', () => {
      const variants = getMotionSafeVariants(true);
      expect(variants.exit).toEqual({ opacity: 1 });
    });

    it('does not include slideUp, slideDown, etc.', () => {
      const variants = getMotionSafeVariants(true) as Record<string, unknown>;
      expect(variants).not.toHaveProperty('fadeIn');
      expect(variants).not.toHaveProperty('slideUp');
      expect(variants).not.toHaveProperty('slideDown');
      expect(variants).not.toHaveProperty('scale');
      expect(variants).not.toHaveProperty('bounce');
    });
  });

  describe('when prefersReducedMotion is false', () => {
    it('returns multiple variant types', () => {
      const variants = getMotionSafeVariants(false);
      expect(variants).toHaveProperty('fadeIn');
      expect(variants).toHaveProperty('slideUp');
      expect(variants).toHaveProperty('slideDown');
      expect(variants).toHaveProperty('slideLeft');
      expect(variants).toHaveProperty('slideRight');
      expect(variants).toHaveProperty('scale');
      expect(variants).toHaveProperty('bounce');
    });

    it('fadeIn variant starts at opacity 0', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { opacity: number } }>;
      expect(variants.fadeIn.initial.opacity).toBe(0);
    });

    it('fadeIn variant animates to opacity 1', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { animate: { opacity: number } }>;
      expect(variants.fadeIn.animate.opacity).toBe(1);
    });

    it('slideUp variant has y offset', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { y: number }; animate: { y: number } }>;
      expect(variants.slideUp.initial.y).toBe(20);
      expect(variants.slideUp.animate.y).toBe(0);
    });

    it('slideDown variant has negative y offset initially', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { y: number } }>;
      expect(variants.slideDown.initial.y).toBe(-20);
    });

    it('slideLeft variant has x offset', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { x: number }; animate: { x: number } }>;
      expect(variants.slideLeft.initial.x).toBe(20);
      expect(variants.slideLeft.animate.x).toBe(0);
    });

    it('slideRight variant has negative x offset initially', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { x: number } }>;
      expect(variants.slideRight.initial.x).toBe(-20);
    });

    it('scale variant starts at 0.95 scale', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { scale: number } }>;
      expect(variants.scale.initial.scale).toBe(0.95);
    });

    it('bounce variant starts at 0.3 scale', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { initial: { scale: number } }>;
      expect(variants.bounce.initial.scale).toBe(0.3);
    });

    it('bounce animate has spring transition', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { animate: { transition: { type: string } } }>;
      expect(variants.bounce.animate.transition.type).toBe('spring');
    });

    it('all animated variants have exit state', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { exit: Record<string, unknown> }>;
      for (const key of Object.keys(variants)) {
        expect(variants[key]).toHaveProperty('exit');
      }
    });

    it('fadeIn exit has opacity 0', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { exit: { opacity: number } }>;
      expect(variants.fadeIn.exit.opacity).toBe(0);
    });

    it('slideUp exit has negative y', () => {
      const variants = getMotionSafeVariants(false) as Record<string, { exit: { y: number } }>;
      expect(variants.slideUp.exit.y).toBe(-20);
    });
  });
});

describe('useReducedMotion module exports', () => {
  it('exports getMotionSafeVariants as a function', () => {
    expect(typeof getMotionSafeVariants).toBe('function');
  });
});
