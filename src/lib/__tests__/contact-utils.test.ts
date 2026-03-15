import { describe, it, expect } from 'vitest';
import {
  getContactBehavior,
  getVAKProfile,
  getDominantVAK,
  getDISCProfile,
  getMetaprogramProfile,
  getDISCConfidence,
  getDecisionRole,
  getCareerStage,
  getDecisionSpeed,
  getDecisionPower,
  getSupportLevel,
  hasCompleteBehaviorProfile,
  DEFAULT_VAK_PROFILE,
} from '../contact-utils';

// ========================================
// getContactBehavior - 15+ scenarios
// ========================================
describe('getContactBehavior', () => {
  it('returns null for null contact', () => {
    expect(getContactBehavior(null)).toBeNull();
  });

  it('returns null for undefined contact', () => {
    expect(getContactBehavior(undefined)).toBeNull();
  });

  it('returns null for contact with no behavior', () => {
    expect(getContactBehavior({ behavior: null } as any)).toBeNull();
  });

  it('returns null for contact with array behavior', () => {
    expect(getContactBehavior({ behavior: [] } as any)).toBeNull();
  });

  it('returns null for contact with string behavior', () => {
    expect(getContactBehavior({ behavior: 'invalid' } as any)).toBeNull();
  });

  it('returns null for contact with number behavior', () => {
    expect(getContactBehavior({ behavior: 42 } as any)).toBeNull();
  });

  it('returns behavior object for valid contact', () => {
    const contact = { behavior: { discProfile: 'D', supportLevel: 8 } } as any;
    const result = getContactBehavior(contact);
    expect(result).not.toBeNull();
    expect(result?.discProfile).toBe('D');
  });

  it('returns behavior with vakProfile', () => {
    const contact = {
      behavior: { vakProfile: { visual: 50, auditory: 30, kinesthetic: 20, primary: 'V' } },
    } as any;
    const result = getContactBehavior(contact);
    expect(result?.vakProfile?.visual).toBe(50);
  });

  it('handles empty behavior object', () => {
    const contact = { behavior: {} } as any;
    const result = getContactBehavior(contact);
    expect(result).toEqual({});
  });
});

// ========================================
// getVAKProfile - 10+ scenarios
// ========================================
describe('getVAKProfile', () => {
  it('returns default VAK for null contact', () => {
    expect(getVAKProfile(null)).toEqual(DEFAULT_VAK_PROFILE);
  });

  it('returns default VAK for contact without vakProfile', () => {
    const contact = { behavior: { discProfile: 'D' } } as any;
    expect(getVAKProfile(contact)).toEqual(DEFAULT_VAK_PROFILE);
  });

  it('returns contact VAK profile when present', () => {
    const vak = { visual: 60, auditory: 20, kinesthetic: 20, primary: 'V' as const };
    const contact = { behavior: { vakProfile: vak } } as any;
    expect(getVAKProfile(contact)).toEqual(vak);
  });

  it('default VAK sums to 100', () => {
    const { visual, auditory, kinesthetic } = DEFAULT_VAK_PROFILE;
    expect(visual + auditory + kinesthetic).toBe(100);
  });

  it('default VAK primary is V', () => {
    expect(DEFAULT_VAK_PROFILE.primary).toBe('V');
  });
});

// ========================================
// getDominantVAK - 10+ scenarios
// ========================================
describe('getDominantVAK', () => {
  it('returns V for null contact (default)', () => {
    expect(getDominantVAK(null)).toBe('V');
  });

  it('returns primary if set', () => {
    const contact = {
      behavior: { vakProfile: { visual: 20, auditory: 60, kinesthetic: 20, primary: 'A' } },
    } as any;
    expect(getDominantVAK(contact)).toBe('A');
  });

  it('returns V when visual is highest and no primary', () => {
    const contact = {
      behavior: { vakProfile: { visual: 50, auditory: 30, kinesthetic: 20 } },
    } as any;
    expect(getDominantVAK(contact)).toBe('V');
  });

  it('returns A when auditory is highest and no primary', () => {
    const contact = {
      behavior: { vakProfile: { visual: 20, auditory: 50, kinesthetic: 30 } },
    } as any;
    expect(getDominantVAK(contact)).toBe('A');
  });

  it('returns K when kinesthetic is highest and no primary', () => {
    const contact = {
      behavior: { vakProfile: { visual: 20, auditory: 20, kinesthetic: 60 } },
    } as any;
    expect(getDominantVAK(contact)).toBe('K');
  });

  it('returns V when visual equals auditory (tiebreaker)', () => {
    const contact = {
      behavior: { vakProfile: { visual: 40, auditory: 40, kinesthetic: 20 } },
    } as any;
    expect(getDominantVAK(contact)).toBe('V');
  });

  it('returns A when auditory equals kinesthetic (tiebreaker)', () => {
    const contact = {
      behavior: { vakProfile: { visual: 20, auditory: 40, kinesthetic: 40 } },
    } as any;
    expect(getDominantVAK(contact)).toBe('A');
  });

  it('handles all equal scores', () => {
    const contact = {
      behavior: { vakProfile: { visual: 33, auditory: 33, kinesthetic: 33 } },
    } as any;
    // V >= A and V >= K so should return V
    expect(getDominantVAK(contact)).toBe('V');
  });
});

// ========================================
// getDISCProfile - 8+ scenarios
// ========================================
describe('getDISCProfile', () => {
  it('returns null for null contact', () => {
    expect(getDISCProfile(null)).toBeNull();
  });

  it('returns discProfile when present', () => {
    const contact = { behavior: { discProfile: 'I' } } as any;
    expect(getDISCProfile(contact)).toBe('I');
  });

  it('falls back to disc field', () => {
    const contact = { behavior: { disc: 'S' } } as any;
    expect(getDISCProfile(contact)).toBe('S');
  });

  it('prefers discProfile over disc', () => {
    const contact = { behavior: { discProfile: 'D', disc: 'C' } } as any;
    expect(getDISCProfile(contact)).toBe('D');
  });

  it('returns null when no DISC data', () => {
    const contact = { behavior: {} } as any;
    expect(getDISCProfile(contact)).toBeNull();
  });

  it('handles all DISC types', () => {
    for (const type of ['D', 'I', 'S', 'C']) {
      const contact = { behavior: { discProfile: type } } as any;
      expect(getDISCProfile(contact)).toBe(type);
    }
  });
});

// ========================================
// getMetaprogramProfile - 5+ scenarios
// ========================================
describe('getMetaprogramProfile', () => {
  it('returns null for null contact', () => {
    expect(getMetaprogramProfile(null)).toBeNull();
  });

  it('returns null when not set', () => {
    expect(getMetaprogramProfile({ behavior: {} } as any)).toBeNull();
  });

  it('returns metaprogram when set', () => {
    const mp = { motivationDirection: 'toward' };
    const contact = { behavior: { metaprogramProfile: mp } } as any;
    expect(getMetaprogramProfile(contact)).toEqual(mp);
  });
});

// ========================================
// Numeric getters - defaults
// ========================================
describe('getDISCConfidence', () => {
  it('returns 0 for null contact', () => {
    expect(getDISCConfidence(null)).toBe(0);
  });

  it('returns value when set', () => {
    expect(getDISCConfidence({ behavior: { discConfidence: 85 } } as any)).toBe(85);
  });

  it('returns 0 when not set', () => {
    expect(getDISCConfidence({ behavior: {} } as any)).toBe(0);
  });
});

describe('getDecisionPower', () => {
  it('returns 5 (default) for null', () => {
    expect(getDecisionPower(null)).toBe(5);
  });

  it('returns value when set', () => {
    expect(getDecisionPower({ behavior: { decisionPower: 9 } } as any)).toBe(9);
  });
});

describe('getSupportLevel', () => {
  it('returns 5 (default) for null', () => {
    expect(getSupportLevel(null)).toBe(5);
  });

  it('returns value when set', () => {
    expect(getSupportLevel({ behavior: { supportLevel: 3 } } as any)).toBe(3);
  });
});

describe('getDecisionRole', () => {
  it('returns null for null contact', () => {
    expect(getDecisionRole(null)).toBeNull();
  });

  it('returns role when set', () => {
    expect(getDecisionRole({ behavior: { decisionRole: 'champion' } } as any)).toBe('champion');
  });
});

describe('getCareerStage', () => {
  it('returns null for null contact', () => {
    expect(getCareerStage(null)).toBeNull();
  });

  it('returns stage when set', () => {
    expect(getCareerStage({ behavior: { careerStage: 'senior' } } as any)).toBe('senior');
  });
});

describe('getDecisionSpeed', () => {
  it('returns null for null contact', () => {
    expect(getDecisionSpeed(null)).toBeNull();
  });

  it('returns speed when set', () => {
    expect(getDecisionSpeed({ behavior: { decisionSpeed: 'fast' } } as any)).toBe('fast');
  });
});

// ========================================
// hasCompleteBehaviorProfile - 10+ scenarios
// ========================================
describe('hasCompleteBehaviorProfile', () => {
  it('returns false for null contact', () => {
    expect(hasCompleteBehaviorProfile(null)).toBe(false);
  });

  it('returns false for empty behavior', () => {
    expect(hasCompleteBehaviorProfile({ behavior: {} } as any)).toBe(false);
  });

  it('returns false when only discProfile set', () => {
    expect(hasCompleteBehaviorProfile({ behavior: { discProfile: 'D' } } as any)).toBe(false);
  });

  it('returns false when only vakProfile set', () => {
    expect(hasCompleteBehaviorProfile({
      behavior: { vakProfile: { visual: 50, auditory: 30, kinesthetic: 20, primary: 'V' } }
    } as any)).toBe(false);
  });

  it('returns false when missing decisionRole', () => {
    expect(hasCompleteBehaviorProfile({
      behavior: {
        discProfile: 'D',
        vakProfile: { visual: 50, auditory: 30, kinesthetic: 20, primary: 'V' },
      }
    } as any)).toBe(false);
  });

  it('returns true when all three present', () => {
    expect(hasCompleteBehaviorProfile({
      behavior: {
        discProfile: 'I',
        vakProfile: { visual: 50, auditory: 30, kinesthetic: 20, primary: 'V' },
        decisionRole: 'champion',
      }
    } as any)).toBe(true);
  });

  it('returns false for null behavior', () => {
    expect(hasCompleteBehaviorProfile({ behavior: null } as any)).toBe(false);
  });
});
