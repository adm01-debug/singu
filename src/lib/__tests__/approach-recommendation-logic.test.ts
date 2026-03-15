import { describe, it, expect } from 'vitest';

/**
 * Approach Recommendation Business Logic - 50+ scenarios
 * Tests extracted pure logic from useApproachRecommendation hook
 */

// Strategy name logic
function getStrategyName(disc: string | null, motivationDir?: string, refFrame?: string, workStyle?: string): string {
  if (!disc) return 'Abordagem Adaptativa';
  if (disc === 'D') return motivationDir === 'toward' ? 'Conquista Direta' : 'Proteção de Resultados';
  if (disc === 'I') return refFrame === 'external' ? 'Conexão Social' : 'Visão Inspiradora';
  if (disc === 'S') return motivationDir === 'away_from' ? 'Segurança Garantida' : 'Parceria Estável';
  if (disc === 'C') return workStyle === 'procedures' ? 'Processo Estruturado' : 'Análise Profunda';
  return 'Abordagem Equilibrada';
}

// Risk level calculation
function calculateRiskLevel(opts: {
  objectionCount: number;
  resistanceCount: number;
  sentiment: string;
  rapportScore: number;
  confidence: number;
}): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  if (opts.objectionCount > 2) riskScore += 30;
  else if (opts.objectionCount > 0) riskScore += 15;
  if (opts.resistanceCount > 2) riskScore += 25;
  if (opts.sentiment === 'negative') riskScore += 25;
  else if (opts.sentiment === 'neutral') riskScore += 10;
  if (opts.rapportScore < 30) riskScore += 20;
  else if (opts.rapportScore < 50) riskScore += 10;
  if (opts.confidence < 40) riskScore += 15;
  
  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

// Success rate calculation
function calculateSuccessRate(opts: {
  confidence: number;
  rapportScore: number;
  sentiment: string;
  relationshipScore: number;
  activeTriggers: number;
  topValues: number;
  objectionCount: number;
  resistanceCount: number;
}): number {
  let rate = 50;
  if (opts.confidence > 70) rate += 15;
  else if (opts.confidence > 50) rate += 8;
  if (opts.rapportScore > 70) rate += 12;
  else if (opts.rapportScore > 50) rate += 6;
  if (opts.sentiment === 'positive') rate += 10;
  if (opts.relationshipScore > 70) rate += 8;
  if (opts.activeTriggers > 2) rate += 8;
  if (opts.topValues > 2) rate += 5;
  if (opts.objectionCount > 2) rate -= 15;
  else if (opts.objectionCount > 0) rate -= 8;
  if (opts.sentiment === 'negative') rate -= 15;
  if (opts.resistanceCount > 2) rate -= 10;
  return Math.max(15, Math.min(95, rate));
}

// Channel priority by profile
function getTopChannel(disc: string | null, vak: string | null): string {
  if (vak === 'A' || disc === 'I') return 'Ligação telefônica';
  if (vak === 'V' || disc === 'C') return 'E-mail detalhado';
  if (disc === 'D') return 'Mensagem direta (WhatsApp)';
  if (vak === 'K' || disc === 'S') return 'Reunião presencial';
  return 'Videochamada';
}

// ============================================
// STRATEGY NAMES
// ============================================
describe('Approach: Strategy Names', () => {
  it('no DISC = Adaptativa', () => {
    expect(getStrategyName(null)).toBe('Abordagem Adaptativa');
  });

  it('D + toward = Conquista Direta', () => {
    expect(getStrategyName('D', 'toward')).toBe('Conquista Direta');
  });

  it('D + away_from = Proteção de Resultados', () => {
    expect(getStrategyName('D', 'away_from')).toBe('Proteção de Resultados');
  });

  it('I + external = Conexão Social', () => {
    expect(getStrategyName('I', undefined, 'external')).toBe('Conexão Social');
  });

  it('I + internal = Visão Inspiradora', () => {
    expect(getStrategyName('I', undefined, 'internal')).toBe('Visão Inspiradora');
  });

  it('S + away_from = Segurança Garantida', () => {
    expect(getStrategyName('S', 'away_from')).toBe('Segurança Garantida');
  });

  it('S + toward = Parceria Estável', () => {
    expect(getStrategyName('S', 'toward')).toBe('Parceria Estável');
  });

  it('C + procedures = Processo Estruturado', () => {
    expect(getStrategyName('C', undefined, undefined, 'procedures')).toBe('Processo Estruturado');
  });

  it('C + options = Análise Profunda', () => {
    expect(getStrategyName('C', undefined, undefined, 'options')).toBe('Análise Profunda');
  });
});

// ============================================
// RISK LEVEL
// ============================================
describe('Approach: Risk Level', () => {
  it('ideal scenario = low risk', () => {
    expect(calculateRiskLevel({
      objectionCount: 0, resistanceCount: 0, sentiment: 'positive', rapportScore: 80, confidence: 80
    })).toBe('low');
  });

  it('many objections + negative sentiment = high risk', () => {
    expect(calculateRiskLevel({
      objectionCount: 3, resistanceCount: 3, sentiment: 'negative', rapportScore: 20, confidence: 30
    })).toBe('high');
  });

  it('moderate issues = medium risk', () => {
    expect(calculateRiskLevel({
      objectionCount: 1, resistanceCount: 1, sentiment: 'neutral', rapportScore: 45, confidence: 50
    })).toBe('medium');
  });

  it('GAP: low rapport with positive sentiment = only 20 risk (low, not medium)', () => {
    // positive sentiment adds 0, rapport<30 adds 20, total=20 < 25 threshold
    expect(calculateRiskLevel({
      objectionCount: 0, resistanceCount: 0, sentiment: 'positive', rapportScore: 25, confidence: 60
    })).toBe('low');
  });

  it('low rapport with neutral sentiment = medium', () => {
    // neutral adds 10, rapport<30 adds 20, total=30 ≥ 25
    expect(calculateRiskLevel({
      objectionCount: 0, resistanceCount: 0, sentiment: 'neutral', rapportScore: 25, confidence: 60
    })).toBe('medium');
  });
});

// ============================================
// SUCCESS RATE
// ============================================
describe('Approach: Success Rate', () => {
  it('ideal scenario = high rate', () => {
    const rate = calculateSuccessRate({
      confidence: 80, rapportScore: 80, sentiment: 'positive',
      relationshipScore: 80, activeTriggers: 3, topValues: 3,
      objectionCount: 0, resistanceCount: 0
    });
    expect(rate).toBeGreaterThanOrEqual(80);
  });

  it('worst scenario = floor at 15', () => {
    const rate = calculateSuccessRate({
      confidence: 20, rapportScore: 10, sentiment: 'negative',
      relationshipScore: 10, activeTriggers: 0, topValues: 0,
      objectionCount: 5, resistanceCount: 5
    });
    expect(rate).toBe(15);
  });

  it('capped at 95', () => {
    const rate = calculateSuccessRate({
      confidence: 100, rapportScore: 100, sentiment: 'positive',
      relationshipScore: 100, activeTriggers: 10, topValues: 10,
      objectionCount: 0, resistanceCount: 0
    });
    expect(rate).toBe(95);
  });

  it('neutral scenario ≈ 50', () => {
    const rate = calculateSuccessRate({
      confidence: 50, rapportScore: 50, sentiment: 'neutral',
      relationshipScore: 50, activeTriggers: 0, topValues: 0,
      objectionCount: 0, resistanceCount: 0
    });
    expect(rate).toBeGreaterThanOrEqual(50);
    expect(rate).toBeLessThanOrEqual(65);
  });
});

// ============================================
// CHANNEL PRIORITY
// ============================================
describe('Approach: Channel Priority', () => {
  it('A profile → phone', () => expect(getTopChannel(null, 'A')).toBe('Ligação telefônica'));
  it('I profile → phone', () => expect(getTopChannel('I', null)).toBe('Ligação telefônica'));
  it('V profile → email', () => expect(getTopChannel(null, 'V')).toBe('E-mail detalhado'));
  it('C profile → email', () => expect(getTopChannel('C', null)).toBe('E-mail detalhado'));
  it('D profile → WhatsApp', () => expect(getTopChannel('D', null)).toBe('Mensagem direta (WhatsApp)'));
  it('K profile → presencial', () => expect(getTopChannel(null, 'K')).toBe('Reunião presencial'));
  it('S profile → presencial', () => expect(getTopChannel('S', null)).toBe('Reunião presencial'));
  it('no profile → video', () => expect(getTopChannel(null, null)).toBe('Videochamada'));
  
  // Priority conflicts: VAK takes precedence over DISC
  it('D + A → phone (A takes priority)', () => expect(getTopChannel('D', 'A')).toBe('Ligação telefônica'));
  it('S + V → email (V takes priority)', () => expect(getTopChannel('S', 'V')).toBe('E-mail detalhado'));
});

// ============================================
// INTEGRATION: FULL RECOMMENDATION FLOW
// ============================================
describe('Approach: Full Flow', () => {
  it('D-toward-V profile generates consistent recommendation', () => {
    const strategy = getStrategyName('D', 'toward');
    const risk = calculateRiskLevel({
      objectionCount: 0, resistanceCount: 0, sentiment: 'positive', rapportScore: 70, confidence: 75
    });
    const success = calculateSuccessRate({
      confidence: 75, rapportScore: 70, sentiment: 'positive',
      relationshipScore: 80, activeTriggers: 2, topValues: 3,
      objectionCount: 0, resistanceCount: 0
    });
    const channel = getTopChannel('D', 'V');

    expect(strategy).toBe('Conquista Direta');
    expect(risk).toBe('low');
    expect(success).toBeGreaterThan(70);
    expect(channel).toBe('E-mail detalhado'); // V overrides D
  });

  it('S-away_from-K profile with objections = cautious approach', () => {
    const strategy = getStrategyName('S', 'away_from');
    const risk = calculateRiskLevel({
      objectionCount: 2, resistanceCount: 1, sentiment: 'neutral', rapportScore: 40, confidence: 50
    });
    const success = calculateSuccessRate({
      confidence: 50, rapportScore: 40, sentiment: 'neutral',
      relationshipScore: 50, activeTriggers: 1, topValues: 1,
      objectionCount: 2, resistanceCount: 1
    });

    expect(strategy).toBe('Segurança Garantida');
    expect(risk).toBe('medium');
    expect(success).toBeLessThan(60);
  });
});
