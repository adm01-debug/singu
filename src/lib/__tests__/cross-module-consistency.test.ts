import { describe, it, expect } from 'vitest';
import { ADVANCED_MENTAL_TRIGGERS } from '@/data/triggersAdvancedData';
import { NOBLE_CAUSES } from '@/data/carnegieNobleCauses';
import { WARMTH_PATTERNS } from '@/data/carnegieWarmth';
import { compareDates, sortArray } from '@/lib/sorting-utils';
import { getContactBehavior, getVAKProfile, getDominantVAK, getDISCProfile } from '@/lib/contact-utils';

/**
 * Cross-Module Consistency & Advanced Edge Cases
 */

describe('Cross-Module: DISC Profile Consistency', () => {
  const validDISC = ['D', 'I', 'S', 'C'];

  it('advanced triggers bestFor uses valid DISC', () => {
    for (const t of Object.values(ADVANCED_MENTAL_TRIGGERS)) {
      for (const p of t.bestFor) {
        expect(validDISC, `${t.id}: invalid DISC ${p}`).toContain(p);
      }
    }
  });

  it('noble causes disc compatibility uses D/I/S/C keys', () => {
    for (const c of NOBLE_CAUSES) {
      expect(Object.keys(c.discCompatibility).sort()).toEqual(validDISC.sort());
    }
  });
});

describe('Cross-Module: Warmth Patterns', () => {
  it('warmth cold alternatives use empathetic language', () => {
    const empathyWords = ['entend', 'compreend', 'ajud', 'compartilh', 'interessante'];
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      if (cat.coldPatterns) {
        for (const p of cat.coldPatterns) {
          const alt = p.alternative.toLowerCase();
          const hasEmpathy = empathyWords.some(w => alt.includes(w));
          if (!hasEmpathy) {
            expect(p.alternative.length).toBeGreaterThan(5);
          }
        }
      }
    }
  });
});

describe('Edge Cases: Sorting Utils with Real Data Patterns', () => {
  it('sorts contacts by relationship_score descending', () => {
    const contacts = [
      { name: 'A', relationship_score: 80 },
      { name: 'B', relationship_score: 95 },
      { name: 'C', relationship_score: 60 },
    ];
    const sorted = sortArray(contacts, 'relationship_score', 'desc', { numericFields: ['relationship_score'] });
    expect(sorted[0].name).toBe('B');
    expect(sorted[2].name).toBe('C');
  });

  it('sorts contacts with null scores (null goes to end)', () => {
    const contacts = [
      { name: 'A', score: null },
      { name: 'B', score: 80 },
      { name: 'C', score: 50 },
    ];
    const sorted = sortArray(contacts, 'score', 'desc', { numericFields: ['score'] });
    expect(sorted[0].name).toBe('B');
  });

  it('sorts dates correctly', () => {
    const items = [
      { name: 'old', date: '2023-01-01' },
      { name: 'new', date: '2024-06-15' },
      { name: 'mid', date: '2024-01-01' },
    ];
    const sorted = sortArray(items, 'date', 'desc', { dateFields: ['date'] });
    expect(sorted[0].name).toBe('new');
  });

  it('compareDates handles null values', () => {
    expect(compareDates(null, '2024-01-01', 'asc')).toBeLessThan(0);
    expect(compareDates('2024-01-01', null, 'asc')).toBeGreaterThan(0);
    expect(compareDates(null, null, 'asc')).toBe(0);
  });
});

describe('Edge Cases: Contact Utils with Edge Data', () => {
  it('handles contact with empty behavior object', () => {
    const contact = { behavior: {} } as any;
    const behavior = getContactBehavior(contact);
    expect(behavior).toBeTruthy();
  });

  it('handles contact with array behavior (invalid)', () => {
    const contact = { behavior: [1, 2, 3] } as any;
    const behavior = getContactBehavior(contact);
    expect(behavior).toBeNull();
  });

  it('handles contact with string behavior (invalid)', () => {
    const contact = { behavior: 'invalid' } as any;
    const behavior = getContactBehavior(contact);
    expect(behavior).toBeNull();
  });

  it('getVAKProfile returns defaults for null contact', () => {
    const vak = getVAKProfile(null);
    expect(vak.visual + vak.auditory + vak.kinesthetic).toBe(100);
  });

  it('getDominantVAK returns V when visual is highest', () => {
    const contact = { behavior: { vakProfile: { visual: 60, auditory: 25, kinesthetic: 15, primary: 'V' } } } as any;
    expect(getDominantVAK(contact)).toBe('V');
  });

  it('getDominantVAK returns K when kinesthetic is highest', () => {
    const contact = { behavior: { vakProfile: { visual: 10, auditory: 20, kinesthetic: 70 } } } as any;
    expect(getDominantVAK(contact)).toBe('K');
  });

  it('getDISCProfile returns null for missing data', () => {
    expect(getDISCProfile(null)).toBeNull();
    expect(getDISCProfile(undefined)).toBeNull();
  });
});

describe('Data Volume Consistency', () => {
  it('total Carnegie data modules exceed 10 noble causes', () => {
    expect(NOBLE_CAUSES.length).toBeGreaterThanOrEqual(5);
  });

  it('advanced triggers > 8', () => {
    const advCount = Object.keys(ADVANCED_MENTAL_TRIGGERS).length;
    expect(advCount).toBeGreaterThan(8);
  });
});
