import { describe, it, expect } from 'vitest';
import {
  NOBLE_CAUSES,
  NOBLE_CAUSE_KEYWORDS,
  NOBLE_CAUSE_INTENSIFIERS,
  getNobleCausesByCategory,
  getNobleCausesByDISC,
  getRandomTemplate
} from '@/data/carnegieNobleCauses';

/**
 * Noble Causes - Data Integrity Tests
 */

// ============================================
// NOBLE CAUSES - DATA
// ============================================
describe('Noble Causes: Data Integrity', () => {
  it('has at least 12 noble causes', () => {
    expect(NOBLE_CAUSES.length).toBeGreaterThanOrEqual(12);
  });

  it('unique IDs', () => {
    const ids = NOBLE_CAUSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all expected categories', () => {
    const cats = new Set(NOBLE_CAUSES.map(c => c.category));
    expect(cats.has('altruism')).toBe(true);
    expect(cats.has('legacy')).toBe(true);
    expect(cats.has('family')).toBe(true);
    expect(cats.has('purpose')).toBe(true);
    expect(cats.has('growth')).toBe(true);
    expect(cats.has('justice')).toBe(true);
    expect(cats.has('innovation')).toBe(true);
    expect(cats.has('community')).toBe(true);
  });

  it('every cause has DISC compatibility 0-100', () => {
    for (const c of NOBLE_CAUSES) {
      for (const [key, val] of Object.entries(c.discCompatibility)) {
        expect(val, `${c.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(val, `${c.id}.${key}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('every cause has at least 1 template', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.templates.length, `${c.id}: no templates`).toBeGreaterThan(0);
    }
  });

  it('every template has opening, bridge, callToAction, emotionalHook', () => {
    for (const c of NOBLE_CAUSES) {
      for (const t of c.templates) {
        expect(t.opening.length, `${t.id}: no opening`).toBeGreaterThan(10);
        expect(t.bridge.length, `${t.id}: no bridge`).toBeGreaterThan(10);
        expect(t.callToAction.length, `${t.id}: no CTA`).toBeGreaterThan(10);
        expect(t.emotionalHook.length, `${t.id}: no hook`).toBeGreaterThan(10);
      }
    }
  });

  it('intensity scores are 1-5', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.intensity, `${c.id}`).toBeGreaterThanOrEqual(1);
      expect(c.intensity, `${c.id}`).toBeLessThanOrEqual(5);
    }
  });

  it('every cause has at least 8 keywords', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.keywords.length, `${c.id}`).toBeGreaterThanOrEqual(8);
    }
  });

  it('NOBLE_CAUSE_KEYWORDS covers all categories', () => {
    expect(Object.keys(NOBLE_CAUSE_KEYWORDS).length).toBe(8);
    for (const [key, keywords] of Object.entries(NOBLE_CAUSE_KEYWORDS)) {
      expect(keywords.length, `${key}`).toBeGreaterThan(10);
    }
  });

  it('intensifiers cover 4 levels', () => {
    expect(NOBLE_CAUSE_INTENSIFIERS.low.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.medium.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.high.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.extreme.length).toBeGreaterThan(3);
  });
});

// ============================================
// NOBLE CAUSES - FUNCTIONS
// ============================================
describe('Noble Causes: Functions', () => {
  it('getNobleCausesByCategory returns correct causes', () => {
    const altruism = getNobleCausesByCategory('altruism');
    expect(altruism.length).toBeGreaterThanOrEqual(2);
    altruism.forEach(c => expect(c.category).toBe('altruism'));
  });

  it('getNobleCausesByCategory returns empty for invalid', () => {
    const result = getNobleCausesByCategory('nonexistent' as unknown as Parameters<typeof getNobleCausesByCategory>[0]);
    expect(result).toEqual([]);
  });

  it('getNobleCausesByDISC returns sorted by compatibility', () => {
    const dCauses = getNobleCausesByDISC('D');
    expect(dCauses.length).toBe(NOBLE_CAUSES.length);
    for (let i = 1; i < dCauses.length; i++) {
      expect(dCauses[i - 1].discCompatibility.D).toBeGreaterThanOrEqual(dCauses[i].discCompatibility.D);
    }
  });

  it('getRandomTemplate returns template for valid cause', () => {
    const template = getRandomTemplate('altruism_community');
    expect(template).not.toBeNull();
    expect(template!.causeId).toBe('altruism_community');
  });

  it('getRandomTemplate returns null for invalid cause', () => {
    const template = getRandomTemplate('nonexistent');
    expect(template).toBeNull();
  });
});
