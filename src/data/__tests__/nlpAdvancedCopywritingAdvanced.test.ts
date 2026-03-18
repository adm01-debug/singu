import { describe, it, expect } from 'vitest';
import { EMOTIONAL_STATE_KEYWORDS, EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';

describe('NLP Advanced - Emotional States', () => {
  const stateKeys = Object.keys(EMOTIONAL_STATE_KEYWORDS);
  const infoKeys = Object.keys(EMOTIONAL_STATE_INFO);

  it('has at least 10 emotional states', () => {
    expect(stateKeys.length).toBeGreaterThanOrEqual(10);
  });

  it('keywords and info keys match', () => {
    expect(stateKeys.sort()).toEqual(infoKeys.sort());
  });

  it('all states have at least 5 keywords', () => {
    for (const [state, keywords] of Object.entries(EMOTIONAL_STATE_KEYWORDS)) {
      expect(keywords.length, `${state}: too few keywords`).toBeGreaterThanOrEqual(5);
    }
  });

  it('no duplicate keywords within a state', () => {
    for (const [state, keywords] of Object.entries(EMOTIONAL_STATE_KEYWORDS)) {
      expect(new Set(keywords).size, `${state}: duplicates`).toBe(keywords.length);
    }
  });

  it('all state info has name, icon, color, description, salesApproach', () => {
    for (const [state, info] of Object.entries(EMOTIONAL_STATE_INFO)) {
      expect(info.name.length, `${state}: no name`).toBeGreaterThan(0);
      expect(info.icon.length, `${state}: no icon`).toBeGreaterThan(0);
      expect(info.color, `${state}: no color`).toMatch(/text-\w+/);
      expect(info.bgColor, `${state}: no bgColor`).toMatch(/bg-\w+/);
      expect(info.description.length, `${state}: no description`).toBeGreaterThan(5);
      expect(info.salesApproach.length, `${state}: no salesApproach`).toBeGreaterThan(5);
    }
  });

  it('keywords are lowercase or known acronyms', () => {
    const allowedUppercase = ['ROI'];
    for (const keywords of Object.values(EMOTIONAL_STATE_KEYWORDS)) {
      for (const kw of keywords) {
        const isLower = kw === kw.toLowerCase();
        const isAllowed = allowedUppercase.includes(kw);
        expect(isLower || isAllowed, `unexpected uppercase: ${kw}`).toBe(true);
      }
    }
  });
});
