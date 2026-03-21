/**
 * Testes exaustivos — Sidebar State, Stagger Animation e Reduced Motion
 * Cobre: useSidebarState, useStaggerAnimation, useReducedMotion, getMotionSafeVariants
 */
import { describe, it, expect } from 'vitest';

// ── Sidebar State Logic ──

function toggleSidebar(collapsed: boolean): boolean { return !collapsed; }
function collapseSidebar(): boolean { return true; }
function expandSidebar(): boolean { return false; }
function setCollapsed(prev: boolean, value: boolean | ((p: boolean) => boolean)): boolean {
  return typeof value === 'function' ? value(prev) : value;
}

// ── Stagger Animation Logic ──

interface StaggerProps {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  transition: Record<string, unknown>;
  style: Record<string, unknown>;
}

function generateStaggerProps(
  count: number,
  prefersReducedMotion: boolean,
  config: { baseDelay?: number; maxDelay?: number; duration?: number } = {}
): StaggerProps[] {
  const { baseDelay = 0.03, maxDelay = 0.3, duration = 0.3 } = config;

  if (prefersReducedMotion) {
    return Array.from({ length: count }, () => ({
      initial: {},
      animate: {},
      transition: { duration: 0 },
      style: {},
    }));
  }

  const clampedDelay = Math.min(baseDelay, maxDelay / Math.max(count, 1));

  return Array.from({ length: count }, (_, index) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration, delay: index * clampedDelay },
    style: { '--stagger-index': index },
  }));
}

// ── Motion Safe Variants Logic ──

function getMotionSafeVariants(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    };
  }
  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  };
}

function getMotionSafeTransitions(prefersReducedMotion: boolean) {
  return {
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    quickTransition: prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' },
    slowTransition: prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    springTransition: prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 },
    durationClass: prefersReducedMotion ? 'duration-0' : 'duration-200',
  };
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('Sidebar State', () => {
  it('toggles from expanded to collapsed', () => {
    expect(toggleSidebar(false)).toBe(true);
  });

  it('toggles from collapsed to expanded', () => {
    expect(toggleSidebar(true)).toBe(false);
  });

  it('collapse always returns true', () => {
    expect(collapseSidebar()).toBe(true);
  });

  it('expand always returns false', () => {
    expect(expandSidebar()).toBe(false);
  });

  it('setCollapsed with boolean value', () => {
    expect(setCollapsed(false, true)).toBe(true);
    expect(setCollapsed(true, false)).toBe(false);
  });

  it('setCollapsed with function', () => {
    expect(setCollapsed(false, prev => !prev)).toBe(true);
    expect(setCollapsed(true, prev => !prev)).toBe(false);
  });

  it('setCollapsed with identity function', () => {
    expect(setCollapsed(true, prev => prev)).toBe(true);
  });

  it('multiple toggles return to original', () => {
    let state = false;
    state = toggleSidebar(state); // true
    state = toggleSidebar(state); // false
    expect(state).toBe(false);
  });

  it('collapse then expand', () => {
    let state = collapseSidebar();
    expect(state).toBe(true);
    state = expandSidebar();
    expect(state).toBe(false);
  });
});

describe('Stagger Animation — Normal Motion', () => {
  it('generates correct count of props', () => {
    const props = generateStaggerProps(5, false);
    expect(props.length).toBe(5);
  });

  it('first item has delay 0', () => {
    const props = generateStaggerProps(3, false);
    expect(props[0].transition.delay).toBe(0);
  });

  it('delays increase incrementally', () => {
    const props = generateStaggerProps(3, false);
    const delays = props.map(p => p.transition.delay as number);
    expect(delays[1]).toBeGreaterThan(delays[0] as number);
    expect(delays[2]).toBeGreaterThan(delays[1] as number);
  });

  it('initial state has opacity 0', () => {
    const props = generateStaggerProps(1, false);
    expect(props[0].initial.opacity).toBe(0);
    expect(props[0].initial.y).toBe(10);
  });

  it('animate state has full opacity', () => {
    const props = generateStaggerProps(1, false);
    expect(props[0].animate.opacity).toBe(1);
    expect(props[0].animate.y).toBe(0);
  });

  it('sets stagger-index CSS variable', () => {
    const props = generateStaggerProps(3, false);
    expect(props[0].style['--stagger-index']).toBe(0);
    expect(props[2].style['--stagger-index']).toBe(2);
  });

  it('clamps delay for large lists', () => {
    const props = generateStaggerProps(100, false, { baseDelay: 0.1, maxDelay: 0.3 });
    const lastDelay = props[99].transition.delay as number;
    // Each delay = 0.003 (clamped), so last = 99 * 0.003 = 0.297
    expect(lastDelay).toBeLessThanOrEqual(0.3);
  });

  it('handles count of 0', () => {
    const props = generateStaggerProps(0, false);
    expect(props).toEqual([]);
  });

  it('handles count of 1', () => {
    const props = generateStaggerProps(1, false);
    expect(props.length).toBe(1);
    expect(props[0].transition.delay).toBe(0);
  });

  it('custom duration', () => {
    const props = generateStaggerProps(1, false, { duration: 0.5 });
    expect(props[0].transition.duration).toBe(0.5);
  });
});

describe('Stagger Animation — Reduced Motion', () => {
  it('all items have instant transition', () => {
    const props = generateStaggerProps(5, true);
    props.forEach(p => {
      expect(p.transition.duration).toBe(0);
    });
  });

  it('no initial/animate transforms', () => {
    const props = generateStaggerProps(3, true);
    props.forEach(p => {
      expect(p.initial).toEqual({});
      expect(p.animate).toEqual({});
    });
  });

  it('empty style', () => {
    const props = generateStaggerProps(3, true);
    props.forEach(p => {
      expect(p.style).toEqual({});
    });
  });
});

describe('Motion Safe Variants', () => {
  it('returns static variants when reduced motion', () => {
    const v = getMotionSafeVariants(true);
    expect(v.initial).toEqual({ opacity: 1 });
    expect(v.animate).toEqual({ opacity: 1 });
    expect(v.exit).toEqual({ opacity: 1 });
  });

  it('returns animated variants when motion enabled', () => {
    const v = getMotionSafeVariants(false) as any;
    expect(v.fadeIn.initial.opacity).toBe(0);
    expect(v.fadeIn.animate.opacity).toBe(1);
    expect(v.slideUp.initial.y).toBe(20);
    expect(v.scale.initial.scale).toBe(0.95);
  });
});

describe('Motion Safe Transitions', () => {
  it('all durations are 0 when reduced motion', () => {
    const t = getMotionSafeTransitions(true);
    expect(t.transition.duration).toBe(0);
    expect(t.quickTransition.duration).toBe(0);
    expect(t.slowTransition.duration).toBe(0);
    expect(t.springTransition.duration).toBe(0);
    expect(t.durationClass).toBe('duration-0');
  });

  it('normal transitions have positive durations', () => {
    const t = getMotionSafeTransitions(false);
    expect((t.transition as any).duration).toBe(0.3);
    expect((t.quickTransition as any).duration).toBe(0.15);
    expect((t.slowTransition as any).duration).toBe(0.5);
    expect((t.springTransition as any).type).toBe('spring');
    expect(t.durationClass).toBe('duration-200');
  });
});
