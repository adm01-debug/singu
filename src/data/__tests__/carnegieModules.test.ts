import { describe, it, expect } from 'vitest';
import { WARMTH_PATTERNS } from '@/data/carnegieWarmth';
import { NOBLE_CAUSES } from '@/data/carnegieNobleCauses';

/**
 * Carnegie Modules - Production Data Tests
 */

// ========================================
// Warmth Score
// ========================================
describe('Carnegie Warmth Patterns', () => {
  it('has greeting patterns', () => {
    expect(WARMTH_PATTERNS.greeting).toBeDefined();
    expect(WARMTH_PATTERNS.greeting.patterns.length).toBeGreaterThan(0);
  });

  it('has empathy patterns', () => {
    expect(WARMTH_PATTERNS.empathy).toBeDefined();
    expect(WARMTH_PATTERNS.empathy.patterns.length).toBeGreaterThan(0);
  });

  it('has personal touch patterns', () => {
    expect(WARMTH_PATTERNS.personalTouch).toBeDefined();
    expect(WARMTH_PATTERNS.personalTouch.patterns.length).toBeGreaterThan(0);
  });

  it('warm patterns have positive scores', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      for (const p of cat.patterns) {
        expect(p.score).toBeGreaterThan(0);
      }
    }
  });

  it('cold patterns have negative scores', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      if (cat.coldPatterns) {
        for (const p of cat.coldPatterns) {
          expect(p.score).toBeLessThan(0);
        }
      }
    }
  });

  it('cold patterns have alternatives', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      if (cat.coldPatterns) {
        for (const p of cat.coldPatterns) {
          expect(p.alternative.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it('greeting detects "que bom falar com você"', () => {
    const text = 'Que bom falar com você!';
    const detected = WARMTH_PATTERNS.greeting.patterns.some(p => p.pattern.test(text));
    expect(detected).toBe(true);
  });

  it('empathy detects understanding phrases', () => {
    const text = 'Entendo perfeitamente sua situação';
    const detected = WARMTH_PATTERNS.empathy.patterns.some(p => p.pattern.test(text));
    expect(detected).toBe(true);
  });
});

// ========================================
// Noble Causes
// ========================================
describe('Carnegie Noble Causes', () => {
  it('has at least 5 noble causes', () => {
    expect(NOBLE_CAUSES.length).toBeGreaterThanOrEqual(5);
  });

  it('all causes have unique IDs', () => {
    const ids = NOBLE_CAUSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all causes have required fields', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.category.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(10);
      expect(c.emotionalAppeal.length).toBeGreaterThan(10);
      expect(c.keywords.length).toBeGreaterThan(0);
      expect(c.templates.length).toBeGreaterThan(0);
    }
  });

  it('all causes have DISC compatibility', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.discCompatibility.D).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.D).toBeLessThanOrEqual(100);
      expect(c.discCompatibility.I).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.S).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.C).toBeGreaterThanOrEqual(0);
    }
  });

  it('all templates have 4 story parts', () => {
    for (const c of NOBLE_CAUSES) {
      for (const t of c.templates) {
        expect(t.opening.length).toBeGreaterThan(5);
        expect(t.bridge.length).toBeGreaterThan(5);
        expect(t.callToAction.length).toBeGreaterThan(5);
        expect(t.emotionalHook.length).toBeGreaterThan(5);
      }
    }
  });

  it('all template IDs are unique', () => {
    const ids = NOBLE_CAUSES.flatMap(c => c.templates.map(t => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('intensity is 1-5', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.intensity).toBeGreaterThanOrEqual(1);
      expect(c.intensity).toBeLessThanOrEqual(5);
    }
  });

  it('covers altruism category', () => {
    const altruism = NOBLE_CAUSES.filter(c => c.category === 'altruism');
    expect(altruism.length).toBeGreaterThan(0);
  });
});
