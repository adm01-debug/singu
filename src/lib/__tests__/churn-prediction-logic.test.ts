import { describe, it, expect } from 'vitest';

/**
 * Churn Prediction Business Logic - 50+ scenarios
 * Tests extracted pure logic from useChurnPrediction hook
 */

// Pure functions extracted from hook
function calculateDaysRisk(daysSinceContact: number): { impact: number; factor: string } | null {
  if (daysSinceContact > 90) {
    return { impact: Math.min(40, (daysSinceContact - 90) / 3), factor: 'Sem contato prolongado' };
  }
  if (daysSinceContact > 30) {
    return { impact: (daysSinceContact - 30) / 2, factor: 'Contato reduzido' };
  }
  return null;
}

function calculateFrequencyTrend(last30: number, prev30: number): {
  trend: 'increasing' | 'stable' | 'decreasing' | 'none';
  riskImpact: number;
} {
  if (last30 === 0 && prev30 === 0) return { trend: 'none', riskImpact: 15 };
  if (last30 < prev30 * 0.5) return { trend: 'decreasing', riskImpact: Math.min(25, (prev30 - last30) * 5) };
  if (last30 > prev30 * 1.5) return { trend: 'increasing', riskImpact: 0 };
  return { trend: 'stable', riskImpact: 0 };
}

function calculateSentimentRisk(negativeCount: number, positiveCount: number): {
  trend: 'positive' | 'neutral' | 'negative' | 'unknown';
  riskAdjustment: number;
} {
  if (negativeCount === 0 && positiveCount === 0) return { trend: 'unknown', riskAdjustment: 0 };
  if (negativeCount > positiveCount) return { trend: 'negative', riskAdjustment: Math.min(20, negativeCount * 5) };
  if (positiveCount > negativeCount * 2) return { trend: 'positive', riskAdjustment: -10 };
  return { trend: 'neutral', riskAdjustment: 0 };
}

function calculateRelationshipRisk(score: number): number {
  if (score < 40) return (40 - score) / 2;
  return 0;
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function getRecommendedAction(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const actions: Record<string, string> = {
    critical: 'Agendar reunião urgente de recuperação',
    high: 'Ligar esta semana para check-in',
    medium: 'Enviar email de acompanhamento',
    low: 'Manter contato regular'
  };
  return actions[level];
}

// ============================================
// DAYS SINCE CONTACT RISK
// ============================================
describe('Churn: Days Risk', () => {
  it('≤30 days = no risk', () => {
    expect(calculateDaysRisk(0)).toBeNull();
    expect(calculateDaysRisk(15)).toBeNull();
    expect(calculateDaysRisk(30)).toBeNull();
  });

  it('31-90 days = moderate risk', () => {
    const risk = calculateDaysRisk(60);
    expect(risk).not.toBeNull();
    expect(risk!.impact).toBe(15); // (60-30)/2
    expect(risk!.factor).toBe('Contato reduzido');
  });

  it('91+ days = high risk (capped at 40)', () => {
    const risk = calculateDaysRisk(120);
    expect(risk!.impact).toBe(10); // (120-90)/3
    expect(risk!.factor).toBe('Sem contato prolongado');
  });

  it('210+ days = capped at 40', () => {
    const risk = calculateDaysRisk(999);
    expect(risk!.impact).toBe(40);
  });

  it('boundary: 31 days', () => {
    const risk = calculateDaysRisk(31);
    expect(risk!.impact).toBe(0.5);
  });

  it('boundary: 91 days', () => {
    const risk = calculateDaysRisk(91);
    expect(risk!.impact).toBeCloseTo(0.333, 1);
  });
});

// ============================================
// FREQUENCY TREND
// ============================================
describe('Churn: Frequency Trend', () => {
  it('both 0 = none + 15 risk', () => {
    const result = calculateFrequencyTrend(0, 0);
    expect(result.trend).toBe('none');
    expect(result.riskImpact).toBe(15);
  });

  it('decreasing (last < prev*0.5)', () => {
    const result = calculateFrequencyTrend(1, 5);
    expect(result.trend).toBe('decreasing');
    expect(result.riskImpact).toBe(20); // (5-1)*5 = 20
  });

  it('increasing (last > prev*1.5)', () => {
    const result = calculateFrequencyTrend(8, 4);
    expect(result.trend).toBe('increasing');
    expect(result.riskImpact).toBe(0);
  });

  it('stable', () => {
    const result = calculateFrequencyTrend(5, 5);
    expect(result.trend).toBe('stable');
    expect(result.riskImpact).toBe(0);
  });

  it('decreasing risk capped at 25', () => {
    const result = calculateFrequencyTrend(0, 10);
    expect(result.riskImpact).toBe(25);
  });

  it('edge: last=2, prev=5 → decreasing', () => {
    const result = calculateFrequencyTrend(2, 5);
    expect(result.trend).toBe('decreasing');
    expect(result.riskImpact).toBe(15);
  });

  it('edge: last=3, prev=5 → stable (3 is not < 2.5)', () => {
    const result = calculateFrequencyTrend(3, 5);
    expect(result.trend).toBe('stable');
  });
});

// ============================================
// SENTIMENT RISK
// ============================================
describe('Churn: Sentiment Risk', () => {
  it('no data = unknown, 0 adjustment', () => {
    const result = calculateSentimentRisk(0, 0);
    expect(result.trend).toBe('unknown');
    expect(result.riskAdjustment).toBe(0);
  });

  it('more negative = negative trend', () => {
    const result = calculateSentimentRisk(3, 1);
    expect(result.trend).toBe('negative');
    expect(result.riskAdjustment).toBe(15);
  });

  it('negative risk capped at 20', () => {
    const result = calculateSentimentRisk(10, 0);
    expect(result.riskAdjustment).toBe(20);
  });

  it('strong positive = -10 bonus', () => {
    const result = calculateSentimentRisk(1, 5);
    expect(result.trend).toBe('positive');
    expect(result.riskAdjustment).toBe(-10);
  });

  it('balanced = neutral', () => {
    const result = calculateSentimentRisk(2, 3);
    expect(result.trend).toBe('neutral');
    expect(result.riskAdjustment).toBe(0);
  });
});

// ============================================
// RELATIONSHIP RISK
// ============================================
describe('Churn: Relationship Score', () => {
  it('score 50 = no risk', () => expect(calculateRelationshipRisk(50)).toBe(0));
  it('score 40 = no risk', () => expect(calculateRelationshipRisk(40)).toBe(0));
  it('score 30 = 5 risk', () => expect(calculateRelationshipRisk(30)).toBe(5));
  it('score 0 = 20 risk', () => expect(calculateRelationshipRisk(0)).toBe(20));
});

// ============================================
// RISK LEVELS
// ============================================
describe('Churn: Risk Levels', () => {
  it('70+ = critical', () => expect(getRiskLevel(70)).toBe('critical'));
  it('50-69 = high', () => {
    expect(getRiskLevel(50)).toBe('high');
    expect(getRiskLevel(69)).toBe('high');
  });
  it('25-49 = medium', () => {
    expect(getRiskLevel(25)).toBe('medium');
    expect(getRiskLevel(49)).toBe('medium');
  });
  it('<25 = low', () => {
    expect(getRiskLevel(0)).toBe('low');
    expect(getRiskLevel(24)).toBe('low');
  });
});

// ============================================
// RECOMMENDED ACTIONS
// ============================================
describe('Churn: Recommended Actions', () => {
  it('critical → urgent meeting', () => {
    expect(getRecommendedAction('critical')).toContain('urgente');
  });
  it('high → call this week', () => {
    expect(getRecommendedAction('high')).toContain('Ligar');
  });
  it('medium → email follow-up', () => {
    expect(getRecommendedAction('medium')).toContain('email');
  });
  it('low → maintain contact', () => {
    expect(getRecommendedAction('low')).toContain('Manter');
  });
});

// ============================================
// INTEGRATION SCENARIOS
// ============================================
describe('Churn: End-to-End Scenarios', () => {
  function simulateChurnScore(opts: {
    daysSince: number;
    last30: number;
    prev30: number;
    negSentiments: number;
    posSentiments: number;
    relationshipScore: number;
  }): { score: number; level: string } {
    let score = 0;
    
    const daysRisk = calculateDaysRisk(opts.daysSince);
    if (daysRisk) score += daysRisk.impact;
    
    const freqResult = calculateFrequencyTrend(opts.last30, opts.prev30);
    score += freqResult.riskImpact;
    
    const sentResult = calculateSentimentRisk(opts.negSentiments, opts.posSentiments);
    score += sentResult.riskAdjustment;
    score = Math.max(0, score);
    
    score += calculateRelationshipRisk(opts.relationshipScore);
    
    score = Math.min(100, Math.round(score));
    return { score, level: getRiskLevel(score) };
  }

  it('healthy contact = low risk', () => {
    const result = simulateChurnScore({
      daysSince: 5, last30: 4, prev30: 3, negSentiments: 0, posSentiments: 5, relationshipScore: 80
    });
    expect(result.level).toBe('low');
  });

  it('neglected contact = high/critical risk', () => {
    const result = simulateChurnScore({
      daysSince: 120, last30: 0, prev30: 5, negSentiments: 3, posSentiments: 0, relationshipScore: 20
    });
    expect(['high', 'critical']).toContain(result.level);
  });

  it('declining engagement = medium risk', () => {
    const result = simulateChurnScore({
      daysSince: 40, last30: 1, prev30: 6, negSentiments: 1, posSentiments: 1, relationshipScore: 50
    });
    expect(['medium', 'high']).toContain(result.level);
  });

  it('positive sentiment reduces risk', () => {
    const withoutPositive = simulateChurnScore({
      daysSince: 45, last30: 2, prev30: 3, negSentiments: 0, posSentiments: 0, relationshipScore: 50
    });
    const withPositive = simulateChurnScore({
      daysSince: 45, last30: 2, prev30: 3, negSentiments: 0, posSentiments: 5, relationshipScore: 50
    });
    expect(withPositive.score).toBeLessThanOrEqual(withoutPositive.score);
  });
});
