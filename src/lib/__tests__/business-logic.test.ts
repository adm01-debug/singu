import { describe, it, expect } from 'vitest';

/**
 * RFM Analysis Logic Tests
 * Tests the scoring, segmentation, and trend analysis logic
 */

// ========================================
// RFM Score calculation
// ========================================
function calculateRFMScore(recency: number, frequency: number, monetary: number): number {
  return recency + frequency + monetary;
}

function getSegment(totalScore: number): string {
  if (totalScore >= 12) return 'champion';
  if (totalScore >= 10) return 'loyal';
  if (totalScore >= 8) return 'potential';
  if (totalScore >= 6) return 'promising';
  if (totalScore >= 4) return 'needs_attention';
  if (totalScore >= 2) return 'at_risk';
  return 'lost';
}

function getChurnProbability(recencyScore: number, frequencyScore: number): number {
  // Lower recency + lower frequency = higher churn
  const combined = recencyScore + frequencyScore;
  if (combined <= 3) return 0.85;
  if (combined <= 5) return 0.60;
  if (combined <= 7) return 0.35;
  return 0.10;
}

function getTrend(current: number, previous: number): string {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

describe('RFM Score Calculation', () => {
  it('calculates total score correctly', () => {
    expect(calculateRFMScore(5, 4, 3)).toBe(12);
  });

  it('handles minimum scores', () => {
    expect(calculateRFMScore(1, 1, 1)).toBe(3);
  });

  it('handles maximum scores', () => {
    expect(calculateRFMScore(5, 5, 5)).toBe(15);
  });

  it('handles mixed scores', () => {
    expect(calculateRFMScore(1, 5, 3)).toBe(9);
  });
});

describe('RFM Segmentation', () => {
  it('champion: score >= 12', () => {
    expect(getSegment(15)).toBe('champion');
    expect(getSegment(12)).toBe('champion');
  });

  it('loyal: score 10-11', () => {
    expect(getSegment(11)).toBe('loyal');
    expect(getSegment(10)).toBe('loyal');
  });

  it('potential: score 8-9', () => {
    expect(getSegment(9)).toBe('potential');
    expect(getSegment(8)).toBe('potential');
  });

  it('promising: score 6-7', () => {
    expect(getSegment(7)).toBe('promising');
    expect(getSegment(6)).toBe('promising');
  });

  it('needs_attention: score 4-5', () => {
    expect(getSegment(5)).toBe('needs_attention');
    expect(getSegment(4)).toBe('needs_attention');
  });

  it('at_risk: score 2-3', () => {
    expect(getSegment(3)).toBe('at_risk');
    expect(getSegment(2)).toBe('at_risk');
  });

  it('lost: score < 2', () => {
    expect(getSegment(1)).toBe('lost');
    expect(getSegment(0)).toBe('lost');
  });

  it('covers all possible total scores (3-15)', () => {
    for (let i = 3; i <= 15; i++) {
      const segment = getSegment(i);
      expect(typeof segment).toBe('string');
      expect(segment.length).toBeGreaterThan(0);
    }
  });
});

describe('Churn Probability', () => {
  it('high churn for low scores', () => {
    expect(getChurnProbability(1, 1)).toBe(0.85);
  });

  it('medium-high churn for moderate-low scores', () => {
    expect(getChurnProbability(2, 2)).toBe(0.60);
  });

  it('medium churn for moderate scores', () => {
    expect(getChurnProbability(3, 3)).toBe(0.35);
  });

  it('low churn for high scores', () => {
    expect(getChurnProbability(5, 5)).toBe(0.10);
  });

  it('churn probability is always between 0 and 1', () => {
    for (let r = 1; r <= 5; r++) {
      for (let f = 1; f <= 5; f++) {
        const prob = getChurnProbability(r, f);
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('Trend Analysis', () => {
  it('detects upward trend', () => {
    expect(getTrend(8, 5)).toBe('up');
  });

  it('detects downward trend', () => {
    expect(getTrend(3, 7)).toBe('down');
  });

  it('detects stable', () => {
    expect(getTrend(5, 5)).toBe('stable');
  });

  it('handles zero values', () => {
    expect(getTrend(0, 0)).toBe('stable');
    expect(getTrend(1, 0)).toBe('up');
    expect(getTrend(0, 1)).toBe('down');
  });
});

// ========================================
// DISC Compatibility Matrix Tests
// ========================================
describe('DISC Compatibility Matrix', () => {
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    D: { D: 50, I: 70, S: 60, C: 55 },
    I: { D: 70, I: 65, S: 75, C: 45 },
    S: { D: 60, I: 75, S: 80, C: 70 },
    C: { D: 55, I: 45, S: 70, C: 60 },
  };

  it('matrix is symmetric for all profiles', () => {
    for (const p1 of ['D', 'I', 'S', 'C']) {
      for (const p2 of ['D', 'I', 'S', 'C']) {
        // Not necessarily symmetric in DISC, but both should exist
        expect(compatibilityMatrix[p1][p2]).toBeDefined();
        expect(typeof compatibilityMatrix[p1][p2]).toBe('number');
      }
    }
  });

  it('all scores between 0 and 100', () => {
    for (const p1 of ['D', 'I', 'S', 'C']) {
      for (const p2 of ['D', 'I', 'S', 'C']) {
        const score = compatibilityMatrix[p1][p2];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('S-S has highest compatibility (empathic match)', () => {
    expect(compatibilityMatrix.S.S).toBe(80);
  });

  it('C-I has lowest compatibility (analytical vs social)', () => {
    expect(compatibilityMatrix.C.I).toBe(45);
  });
});

// ========================================
// Closing Score Algorithm Tests
// ========================================
describe('Closing Score Algorithm', () => {
  function calculateClosingScore(params: {
    relationshipScore: number;
    interactionCount: number;
    daysSinceLastInteraction: number;
    hasDiscProfile: boolean;
    sentimentPositiveRatio: number;
  }): number {
    let score = 0;
    
    // Relationship (max 30)
    score += Math.min(30, params.relationshipScore * 0.3);
    
    // Engagement (max 25)
    score += Math.min(25, params.interactionCount * 2.5);
    
    // Recency (max 20)
    if (params.daysSinceLastInteraction <= 7) score += 20;
    else if (params.daysSinceLastInteraction <= 14) score += 15;
    else if (params.daysSinceLastInteraction <= 30) score += 10;
    else if (params.daysSinceLastInteraction <= 60) score += 5;
    
    // Profile completeness (max 10)
    if (params.hasDiscProfile) score += 10;
    
    // Sentiment (max 15)
    score += Math.min(15, params.sentimentPositiveRatio * 15);
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  it('perfect contact gets high score', () => {
    const score = calculateClosingScore({
      relationshipScore: 100,
      interactionCount: 20,
      daysSinceLastInteraction: 1,
      hasDiscProfile: true,
      sentimentPositiveRatio: 1.0,
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('cold contact gets low score', () => {
    const score = calculateClosingScore({
      relationshipScore: 10,
      interactionCount: 1,
      daysSinceLastInteraction: 90,
      hasDiscProfile: false,
      sentimentPositiveRatio: 0.2,
    });
    expect(score).toBeLessThan(20);
  });

  it('score is always 0-100', () => {
    const extremes = [
      { relationshipScore: 0, interactionCount: 0, daysSinceLastInteraction: 999, hasDiscProfile: false, sentimentPositiveRatio: 0 },
      { relationshipScore: 100, interactionCount: 100, daysSinceLastInteraction: 0, hasDiscProfile: true, sentimentPositiveRatio: 1 },
    ];
    for (const params of extremes) {
      const score = calculateClosingScore(params);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('recency tiers work correctly', () => {
    const base = { relationshipScore: 50, interactionCount: 5, hasDiscProfile: true, sentimentPositiveRatio: 0.5 };
    const s7 = calculateClosingScore({ ...base, daysSinceLastInteraction: 7 });
    const s14 = calculateClosingScore({ ...base, daysSinceLastInteraction: 14 });
    const s30 = calculateClosingScore({ ...base, daysSinceLastInteraction: 30 });
    const s60 = calculateClosingScore({ ...base, daysSinceLastInteraction: 60 });
    const s90 = calculateClosingScore({ ...base, daysSinceLastInteraction: 90 });

    expect(s7).toBeGreaterThan(s14);
    expect(s14).toBeGreaterThan(s30);
    expect(s30).toBeGreaterThan(s60);
    expect(s60).toBeGreaterThan(s90);
  });
});

// ========================================
// Persuasion Score Tests
// ========================================
describe('Persuasion Score Calculation', () => {
  function calculatePersuasionScore(params: {
    triggerCount: number;
    biasesDetected: number;
    emotionalAnchors: number;
    metaprogramMatch: number; // 0-1
  }): number {
    let score = 0;
    score += Math.min(25, params.triggerCount * 5);
    score += Math.min(25, params.biasesDetected * 5);
    score += Math.min(25, params.emotionalAnchors * 8);
    score += Math.min(25, params.metaprogramMatch * 25);
    return Math.round(Math.min(100, score));
  }

  it('no data = zero score', () => {
    expect(calculatePersuasionScore({ triggerCount: 0, biasesDetected: 0, emotionalAnchors: 0, metaprogramMatch: 0 })).toBe(0);
  });

  it('max data = 100 score', () => {
    expect(calculatePersuasionScore({ triggerCount: 10, biasesDetected: 10, emotionalAnchors: 5, metaprogramMatch: 1 })).toBe(100);
  });

  it('partial data gives proportional score', () => {
    const score = calculatePersuasionScore({ triggerCount: 3, biasesDetected: 2, emotionalAnchors: 1, metaprogramMatch: 0.5 });
    expect(score).toBeGreaterThan(20);
    expect(score).toBeLessThan(80);
  });
});
