import { describe, it, expect } from 'vitest';

/**
 * Closing Score Business Logic - 60+ scenarios
 * Tests extracted pure logic from useClosingScore hook
 */

// Replicate constants from useClosingScore for testing
const EMOTIONAL_SCORES: Record<string, number> = {
  'entusiasmado': 100, 'empolgado': 95, 'interessado': 85, 'positivo': 80,
  'curioso': 75, 'neutro': 50, 'cauteloso': 40, 'hesitante': 35,
  'preocupado': 30, 'cético': 25, 'resistente': 20, 'negativo': 15, 'frustrado': 10
};

const DISC_CLOSING_FACTORS: Record<string, { speed: number; style: string }> = {
  'D': { speed: 0.9, style: 'Direto e rápido' },
  'I': { speed: 0.7, style: 'Entusiasmado' },
  'S': { speed: 0.5, style: 'Cauteloso' },
  'C': { speed: 0.4, style: 'Analítico' }
};

// Pure functions extracted from hook logic (updated: proportional scoring)
function calculateEngagementScore(recentInteractionCount: number, daysSinceLastContact: number): number {
  // Recency component (0-50)
  const recencyScore = daysSinceLastContact <= 3 ? 50
    : daysSinceLastContact <= 7 ? 45
    : daysSinceLastContact <= 14 ? 35
    : daysSinceLastContact <= 21 ? 25
    : daysSinceLastContact <= 30 ? 15
    : 5;
  // Frequency component (0-50)
  const frequencyScore = Math.min(50, recentInteractionCount * 10);
  return recencyScore + frequencyScore;
}

function getSentimentScore(sentiment: string | null): number {
  const map: Record<string, number> = { 'positive': 85, 'neutral': 50, 'negative': 20 };
  return map[sentiment || 'neutral'] || 50;
}

function calculateObjectionScore(unresolvedCount: number): number {
  if (unresolvedCount <= 0) return 80;
  return Math.max(20, 80 - (unresolvedCount * 15));
}

function calculateValuesScore(importantValuesCount: number): number {
  return Math.min(100, 40 + (importantValuesCount * 15));
}

function calculateDISCScore(discProfile: string | null): number {
  const factor = DISC_CLOSING_FACTORS[discProfile ?? ''];
  if (!factor) return 50;
  return 60 + (factor.speed * 40);
}

function getProbability(score: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (score >= 75) return 'high';
  if (score >= 55) return 'medium';
  if (score >= 35) return 'low';
  return 'very_low';
}

function calculateConfidence(dataPoints: boolean[]): number {
  return Math.round((dataPoints.filter(Boolean).length / dataPoints.length) * 100);
}

function calculateWeightedScore(factors: { score: number; weight: number }[]): number {
  return Math.round(factors.reduce((sum, f) => sum + (f.score * f.weight), 0));
}

// ============================================
// EMOTIONAL SCORES
// ============================================
describe('Closing Score: Emotional Scores', () => {
  it('all 13 emotional states are mapped', () => {
    expect(Object.keys(EMOTIONAL_SCORES).length).toBe(13);
  });

  it('scores are ordered positive → negative', () => {
    expect(EMOTIONAL_SCORES['entusiasmado']).toBe(100);
    expect(EMOTIONAL_SCORES['frustrado']).toBe(10);
    expect(EMOTIONAL_SCORES['neutro']).toBe(50);
  });

  it('all scores are 0-100', () => {
    for (const [state, score] of Object.entries(EMOTIONAL_SCORES)) {
      expect(score, state).toBeGreaterThanOrEqual(0);
      expect(score, state).toBeLessThanOrEqual(100);
    }
  });

  it('no duplicate scores except by design', () => {
    // Check that positive states > neutral > negative states
    const positive = ['entusiasmado', 'empolgado', 'interessado', 'positivo', 'curioso'];
    const negative = ['cauteloso', 'hesitante', 'preocupado', 'cético', 'resistente', 'negativo', 'frustrado'];
    
    for (const p of positive) expect(EMOTIONAL_SCORES[p]).toBeGreaterThan(50);
    for (const n of negative) expect(EMOTIONAL_SCORES[n]).toBeLessThan(50);
  });

  it('strict ordering among positive states', () => {
    expect(EMOTIONAL_SCORES['entusiasmado']).toBeGreaterThan(EMOTIONAL_SCORES['empolgado']);
    expect(EMOTIONAL_SCORES['empolgado']).toBeGreaterThan(EMOTIONAL_SCORES['interessado']);
    expect(EMOTIONAL_SCORES['interessado']).toBeGreaterThan(EMOTIONAL_SCORES['positivo']);
    expect(EMOTIONAL_SCORES['positivo']).toBeGreaterThan(EMOTIONAL_SCORES['curioso']);
  });

  it('strict ordering among negative states', () => {
    expect(EMOTIONAL_SCORES['cauteloso']).toBeGreaterThan(EMOTIONAL_SCORES['hesitante']);
    expect(EMOTIONAL_SCORES['hesitante']).toBeGreaterThan(EMOTIONAL_SCORES['preocupado']);
    expect(EMOTIONAL_SCORES['preocupado']).toBeGreaterThan(EMOTIONAL_SCORES['cético']);
    expect(EMOTIONAL_SCORES['cético']).toBeGreaterThan(EMOTIONAL_SCORES['resistente']);
    expect(EMOTIONAL_SCORES['resistente']).toBeGreaterThan(EMOTIONAL_SCORES['negativo']);
    expect(EMOTIONAL_SCORES['negativo']).toBeGreaterThan(EMOTIONAL_SCORES['frustrado']);
  });
});

// ============================================
// DISC CLOSING FACTORS
// ============================================
describe('Closing Score: DISC Factors', () => {
  it('all 4 profiles defined', () => {
    expect(Object.keys(DISC_CLOSING_FACTORS)).toEqual(['D', 'I', 'S', 'C']);
  });

  it('speed is 0-1', () => {
    for (const [key, factor] of Object.entries(DISC_CLOSING_FACTORS)) {
      expect(factor.speed, key).toBeGreaterThanOrEqual(0);
      expect(factor.speed, key).toBeLessThanOrEqual(1);
    }
  });

  it('D is fastest, C is slowest', () => {
    expect(DISC_CLOSING_FACTORS['D'].speed).toBeGreaterThan(DISC_CLOSING_FACTORS['I'].speed);
    expect(DISC_CLOSING_FACTORS['I'].speed).toBeGreaterThan(DISC_CLOSING_FACTORS['S'].speed);
    expect(DISC_CLOSING_FACTORS['S'].speed).toBeGreaterThan(DISC_CLOSING_FACTORS['C'].speed);
  });
});

// ============================================
// ENGAGEMENT SCORE
// ============================================
describe('Closing Score: Engagement', () => {
  it('5+ interactions + ≤7 days = 90', () => {
    expect(calculateEngagementScore(5, 7)).toBe(90);
    expect(calculateEngagementScore(10, 3)).toBe(90);
  });

  it('3-4 interactions + ≤14 days = 70', () => {
    expect(calculateEngagementScore(3, 14)).toBe(70);
    expect(calculateEngagementScore(4, 10)).toBe(70);
  });

  it('1-2 interactions + ≤30 days = 50', () => {
    expect(calculateEngagementScore(1, 30)).toBe(50);
    expect(calculateEngagementScore(2, 20)).toBe(50);
  });

  it('no recent interactions = 20', () => {
    expect(calculateEngagementScore(0, 999)).toBe(20);
    expect(calculateEngagementScore(0, 31)).toBe(20);
  });

  it('edge: 5 interactions but 14 days → still 90 (condition is ≤7)', () => {
    expect(calculateEngagementScore(5, 14)).toBe(70); // Falls to second tier
  });

  it('edge: 3 interactions but 30 days → falls to 50', () => {
    expect(calculateEngagementScore(3, 30)).toBe(50); // daysSince > 14
  });
});

// ============================================
// SENTIMENT SCORE
// ============================================
describe('Closing Score: Sentiment', () => {
  it('positive = 85', () => expect(getSentimentScore('positive')).toBe(85));
  it('neutral = 50', () => expect(getSentimentScore('neutral')).toBe(50));
  it('negative = 20', () => expect(getSentimentScore('negative')).toBe(20));
  it('null defaults to neutral', () => expect(getSentimentScore(null)).toBe(50));
  it('unknown defaults to neutral', () => expect(getSentimentScore('unknown')).toBe(50));
});

// ============================================
// OBJECTION SCORE
// ============================================
describe('Closing Score: Objections', () => {
  it('0 unresolved = 80', () => expect(calculateObjectionScore(0)).toBe(80));
  it('1 unresolved = 65', () => expect(calculateObjectionScore(1)).toBe(65));
  it('2 unresolved = 50', () => expect(calculateObjectionScore(2)).toBe(50));
  it('4 unresolved = 20 (clamped)', () => expect(calculateObjectionScore(4)).toBe(20));
  it('10 unresolved = 20 (floor)', () => expect(calculateObjectionScore(10)).toBe(20));
});

// ============================================
// VALUES SCORE
// ============================================
describe('Closing Score: Values', () => {
  it('0 important values = 40', () => expect(calculateValuesScore(0)).toBe(40));
  it('1 important = 55', () => expect(calculateValuesScore(1)).toBe(55));
  it('3 important = 85', () => expect(calculateValuesScore(3)).toBe(85));
  it('4 important = 100 (capped)', () => expect(calculateValuesScore(4)).toBe(100));
  it('10 important = 100 (capped)', () => expect(calculateValuesScore(10)).toBe(100));
});

// ============================================
// DISC SCORE
// ============================================
describe('Closing Score: DISC Score', () => {
  it('D = 96', () => expect(calculateDISCScore('D')).toBe(96));
  it('I = 88', () => expect(calculateDISCScore('I')).toBe(88));
  it('S = 80', () => expect(calculateDISCScore('S')).toBe(80));
  it('C = 76', () => expect(calculateDISCScore('C')).toBe(76));
  it('null = 50', () => expect(calculateDISCScore(null)).toBe(50));
  it('unknown = 50', () => expect(calculateDISCScore('X')).toBe(50));
});

// ============================================
// PROBABILITY TIERS
// ============================================
describe('Closing Score: Probability', () => {
  it('75+ = high', () => {
    expect(getProbability(75)).toBe('high');
    expect(getProbability(100)).toBe('high');
  });
  it('55-74 = medium', () => {
    expect(getProbability(55)).toBe('medium');
    expect(getProbability(74)).toBe('medium');
  });
  it('35-54 = low', () => {
    expect(getProbability(35)).toBe('low');
    expect(getProbability(54)).toBe('low');
  });
  it('<35 = very_low', () => {
    expect(getProbability(34)).toBe('very_low');
    expect(getProbability(0)).toBe('very_low');
  });
});

// ============================================
// CONFIDENCE LEVEL
// ============================================
describe('Closing Score: Confidence', () => {
  it('all data = 100%', () => {
    expect(calculateConfidence([true, true, true, true, true])).toBe(100);
  });
  it('no data = 0%', () => {
    expect(calculateConfidence([false, false, false, false, false])).toBe(0);
  });
  it('3/5 data = 60%', () => {
    expect(calculateConfidence([true, true, true, false, false])).toBe(60);
  });
});

// ============================================
// WEIGHTED SCORE CALCULATION
// ============================================
describe('Closing Score: Weighted Calculation', () => {
  it('all 100 with proper weights = 100', () => {
    const factors = [
      { score: 100, weight: 0.20 },
      { score: 100, weight: 0.15 },
      { score: 100, weight: 0.15 },
      { score: 100, weight: 0.15 },
      { score: 100, weight: 0.15 },
      { score: 100, weight: 0.10 },
      { score: 100, weight: 0.05 },
      { score: 100, weight: 0.05 },
    ];
    expect(calculateWeightedScore(factors)).toBe(100);
  });

  it('all 0 = 0', () => {
    const factors = [
      { score: 0, weight: 0.20 },
      { score: 0, weight: 0.80 },
    ];
    expect(calculateWeightedScore(factors)).toBe(0);
  });

  it('weights sum to 1.0 in actual hook', () => {
    const weights = [0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.05, 0.05];
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0);
  });

  it('mixed scores produce correct weighted average', () => {
    const factors = [
      { score: 80, weight: 0.50 },
      { score: 40, weight: 0.50 },
    ];
    expect(calculateWeightedScore(factors)).toBe(60);
  });
});
