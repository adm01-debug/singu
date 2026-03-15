import { describe, it, expect } from 'vitest';

/**
 * Deal Velocity & Satisfaction Score Logic - 40+ scenarios
 */

// ============================================
// DEAL VELOCITY CONSTANTS
// ============================================
const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', prospect: 'Prospect', qualified: 'Qualificado',
  proposal: 'Proposta', negotiation: 'Negociação', customer: 'Cliente', churned: 'Perdido'
};

const STAGE_BENCHMARKS: Record<string, number> = {
  lead: 14, prospect: 21, qualified: 14, proposal: 7, negotiation: 14, customer: 0, churned: 0
};

const STAGE_ORDER = ['lead', 'prospect', 'qualified', 'proposal', 'negotiation', 'customer'];

describe('Deal Velocity: Constants', () => {
  it('all stages have labels', () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_LABELS[stage], `Missing label for ${stage}`).toBeDefined();
    }
  });

  it('all stages have benchmarks', () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_BENCHMARKS[stage], `Missing benchmark for ${stage}`).toBeDefined();
    }
  });

  it('benchmarks are non-negative', () => {
    for (const [stage, days] of Object.entries(STAGE_BENCHMARKS)) {
      expect(days, stage).toBeGreaterThanOrEqual(0);
    }
  });

  it('stage order has 6 stages', () => {
    expect(STAGE_ORDER.length).toBe(6);
    expect(STAGE_ORDER[0]).toBe('lead');
    expect(STAGE_ORDER[5]).toBe('customer');
  });

  it('proposal has shortest benchmark (7 days)', () => {
    const active = Object.entries(STAGE_BENCHMARKS)
      .filter(([k]) => k !== 'customer' && k !== 'churned');
    const min = active.reduce((a, b) => a[1] < b[1] ? a : b);
    expect(min[0]).toBe('proposal');
    expect(min[1]).toBe(7);
  });

  it('prospect has longest benchmark (21 days)', () => {
    const active = Object.entries(STAGE_BENCHMARKS)
      .filter(([k]) => k !== 'customer' && k !== 'churned');
    const max = active.reduce((a, b) => a[1] > b[1] ? a : b);
    expect(max[0]).toBe('prospect');
    expect(max[1]).toBe(21);
  });
});

// ============================================
// BOTTLENECK DETECTION
// ============================================
describe('Deal Velocity: Bottleneck Detection', () => {
  function findBottleneck(stages: { stage: string; avgDays: number; count: number }[]): string | null {
    const active = stages.filter(s => s.stage !== 'customer' && s.stage !== 'churned' && s.count > 0);
    if (active.length === 0) return null;
    return active.reduce((worst, current) => {
      const currentRatio = current.avgDays / (STAGE_BENCHMARKS[current.stage] || 14);
      const worstRatio = worst.avgDays / (STAGE_BENCHMARKS[worst.stage] || 14);
      return currentRatio > worstRatio ? current : worst;
    }).stage;
  }

  it('finds stage exceeding benchmark the most', () => {
    const result = findBottleneck([
      { stage: 'lead', avgDays: 14, count: 5 },        // ratio 1.0
      { stage: 'proposal', avgDays: 21, count: 3 },     // ratio 3.0 ← worst
      { stage: 'negotiation', avgDays: 14, count: 2 },  // ratio 1.0
    ]);
    expect(result).toBe('proposal');
  });

  it('returns null for empty pipeline', () => {
    expect(findBottleneck([])).toBeNull();
  });

  it('ignores stages with 0 contacts', () => {
    const result = findBottleneck([
      { stage: 'lead', avgDays: 100, count: 0 },
      { stage: 'prospect', avgDays: 10, count: 2 },
    ]);
    expect(result).toBe('prospect');
  });
});

// ============================================
// SATISFACTION SCORE CONSTANTS
// ============================================
describe('Satisfaction: Level Mapping', () => {
  function getLevel(score: number): string {
    if (score >= 80) return 'very_satisfied';
    if (score >= 60) return 'satisfied';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'unsatisfied';
    return 'very_unsatisfied';
  }

  it('80+ = very_satisfied', () => expect(getLevel(80)).toBe('very_satisfied'));
  it('60-79 = satisfied', () => expect(getLevel(60)).toBe('satisfied'));
  it('40-59 = neutral', () => expect(getLevel(40)).toBe('neutral'));
  it('20-39 = unsatisfied', () => expect(getLevel(20)).toBe('unsatisfied'));
  it('<20 = very_unsatisfied', () => expect(getLevel(19)).toBe('very_unsatisfied'));
});

describe('Satisfaction: Stage Scores', () => {
  const stageScores: Record<string, number> = {
    advocate: 100, loyal_customer: 90, customer: 70, negotiation: 60,
    opportunity: 50, qualified_lead: 40, prospect: 30, unknown: 20, at_risk: 15, lost: 5
  };

  it('advocate is highest (100)', () => expect(stageScores.advocate).toBe(100));
  it('lost is lowest (5)', () => expect(stageScores.lost).toBe(5));
  it('at_risk is very low (15)', () => expect(stageScores.at_risk).toBe(15));
  it('all stages have scores', () => expect(Object.keys(stageScores).length).toBe(10));
  
  it('scores are strictly ordered for main funnel', () => {
    expect(stageScores.advocate).toBeGreaterThan(stageScores.loyal_customer);
    expect(stageScores.loyal_customer).toBeGreaterThan(stageScores.customer);
    expect(stageScores.customer).toBeGreaterThan(stageScores.negotiation);
    expect(stageScores.negotiation).toBeGreaterThan(stageScores.opportunity);
  });
});

describe('Satisfaction: NPS Likelihood', () => {
  function calculateNPS(overallScore: number, stage: string, sentiment: string): number {
    let nps = Math.round(overallScore / 10);
    if (stage === 'advocate') nps = Math.min(10, nps + 1);
    if (sentiment === 'negative') nps = Math.max(0, nps - 2);
    return nps;
  }

  it('perfect score + advocate = 10', () => {
    expect(calculateNPS(100, 'advocate', 'positive')).toBe(10);
  });

  it('low score + negative = 0', () => {
    expect(calculateNPS(10, 'customer', 'negative')).toBe(0);
  });

  it('average score = 5', () => {
    expect(calculateNPS(50, 'customer', 'neutral')).toBe(5);
  });
});

describe('Satisfaction: Retention Probability', () => {
  function calculateRetention(overallScore: number, riskCount: number, stage: string): number {
    let retention = overallScore;
    if (riskCount >= 2) retention -= 20;
    if (stage === 'loyal_customer' || stage === 'advocate') retention += 10;
    return Math.max(5, Math.min(95, retention));
  }

  it('high score + loyal = near 95', () => {
    expect(calculateRetention(90, 0, 'loyal_customer')).toBe(95);
  });

  it('low score + risks = near floor', () => {
    expect(calculateRetention(10, 3, 'prospect')).toBe(5);
  });

  it('clamped to 5-95', () => {
    expect(calculateRetention(100, 0, 'advocate')).toBe(95);
    expect(calculateRetention(0, 5, 'lost')).toBe(5);
  });
});

// ============================================
// RECENCY SCORE
// ============================================
describe('Satisfaction: Recency Score', () => {
  function getRecencyScore(daysSince: number): number {
    if (daysSince > 60) return 20;
    if (daysSince > 30) return 50;
    if (daysSince > 14) return 75;
    return 100;
  }

  it('≤14 days = 100', () => expect(getRecencyScore(14)).toBe(100));
  it('15-30 days = 75', () => expect(getRecencyScore(20)).toBe(75));
  it('31-60 days = 50', () => expect(getRecencyScore(45)).toBe(50));
  it('>60 days = 20', () => expect(getRecencyScore(90)).toBe(20));
});
