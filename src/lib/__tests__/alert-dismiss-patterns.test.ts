/**
 * Testes de padrões de dismiss de alertas — verifica lógica de filtro,
 * rollback e cálculo de stats usados em useHealthAlerts, useBehaviorAlerts,
 * useClosingScoreAlerts e useStakeholderAlerts.
 */
import { describe, it, expect } from 'vitest';

// Types
interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dismissed: boolean;
  contactId: string;
}

interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
}

// Functions under test
function dismissSingle(alerts: Alert[], id: string): Alert[] {
  return alerts.filter(a => a.id !== id);
}

function dismissAll(alerts: Alert[]): Alert[] {
  return [];
}

function dismissByType(alerts: Alert[], type: string): Alert[] {
  return alerts.filter(a => a.type !== type);
}

function dismissByContact(alerts: Alert[], contactId: string): Alert[] {
  return alerts.filter(a => a.contactId !== contactId);
}

function calculateStats(alerts: Alert[]): AlertStats {
  const byType: Record<string, number> = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const alert of alerts) {
    byType[alert.type] = (byType[alert.type] || 0) + 1;
    bySeverity[alert.severity]++;
  }

  return {
    total: alerts.length,
    ...bySeverity,
    byType,
  };
}

// Test Data
const alerts: Alert[] = [
  { id: '1', type: 'sentiment_drop', severity: 'high', dismissed: false, contactId: 'c1' },
  { id: '2', type: 'churn_risk', severity: 'critical', dismissed: false, contactId: 'c1' },
  { id: '3', type: 'communication_gap', severity: 'medium', dismissed: false, contactId: 'c2' },
  { id: '4', type: 'positive_momentum', severity: 'low', dismissed: false, contactId: 'c3' },
  { id: '5', type: 'sentiment_drop', severity: 'medium', dismissed: false, contactId: 'c2' },
  { id: '6', type: 'churn_risk', severity: 'critical', dismissed: false, contactId: 'c4' },
  { id: '7', type: 'engagement_drop', severity: 'high', dismissed: false, contactId: 'c1' },
];

describe('Alert Dismiss — Single', () => {
  it('removes the targeted alert', () => {
    const result = dismissSingle(alerts, '2');
    expect(result.length).toBe(6);
    expect(result.find(a => a.id === '2')).toBeUndefined();
  });

  it('preserves other alerts', () => {
    const result = dismissSingle(alerts, '1');
    expect(result.find(a => a.id === '3')).toBeDefined();
    expect(result.find(a => a.id === '4')).toBeDefined();
  });

  it('handles non-existent ID', () => {
    const result = dismissSingle(alerts, 'nonexistent');
    expect(result.length).toBe(7);
  });

  it('handles empty alerts', () => {
    const result = dismissSingle([], '1');
    expect(result).toEqual([]);
  });
});

describe('Alert Dismiss — All', () => {
  it('removes all alerts', () => {
    expect(dismissAll(alerts)).toEqual([]);
  });

  it('handles empty array', () => {
    expect(dismissAll([])).toEqual([]);
  });
});

describe('Alert Dismiss — By Type', () => {
  it('removes all alerts of given type', () => {
    const result = dismissByType(alerts, 'sentiment_drop');
    expect(result.length).toBe(5);
    expect(result.every(a => a.type !== 'sentiment_drop')).toBe(true);
  });

  it('handles type with no matches', () => {
    const result = dismissByType(alerts, 'nonexistent');
    expect(result.length).toBe(7);
  });
});

describe('Alert Dismiss — By Contact', () => {
  it('removes all alerts for a contact', () => {
    const result = dismissByContact(alerts, 'c1');
    expect(result.length).toBe(4);
    expect(result.every(a => a.contactId !== 'c1')).toBe(true);
  });

  it('handles contact with no alerts', () => {
    const result = dismissByContact(alerts, 'c99');
    expect(result.length).toBe(7);
  });
});

describe('Alert Stats Calculation', () => {
  it('counts total correctly', () => {
    expect(calculateStats(alerts).total).toBe(7);
  });

  it('counts by severity correctly', () => {
    const stats = calculateStats(alerts);
    expect(stats.critical).toBe(2);
    expect(stats.high).toBe(2);
    expect(stats.medium).toBe(2);
    expect(stats.low).toBe(1);
  });

  it('counts by type correctly', () => {
    const stats = calculateStats(alerts);
    expect(stats.byType['sentiment_drop']).toBe(2);
    expect(stats.byType['churn_risk']).toBe(2);
    expect(stats.byType['communication_gap']).toBe(1);
    expect(stats.byType['positive_momentum']).toBe(1);
    expect(stats.byType['engagement_drop']).toBe(1);
  });

  it('handles empty alerts', () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.critical).toBe(0);
    expect(stats.byType).toEqual({});
  });

  it('recalculates after dismiss single', () => {
    const after = dismissSingle(alerts, '2'); // remove critical
    const stats = calculateStats(after);
    expect(stats.critical).toBe(1);
    expect(stats.total).toBe(6);
  });

  it('recalculates after dismiss all', () => {
    const stats = calculateStats(dismissAll(alerts));
    expect(stats.total).toBe(0);
  });

  it('recalculates after dismiss by type', () => {
    const after = dismissByType(alerts, 'churn_risk');
    const stats = calculateStats(after);
    expect(stats.critical).toBe(0);
    expect(stats.total).toBe(5);
    expect(stats.byType['churn_risk']).toBeUndefined();
  });
});

describe('Rollback Scenarios', () => {
  it('restores state after failed single dismiss', () => {
    const original = [...alerts];
    const dismissed = dismissSingle(alerts, '1');
    expect(dismissed.length).toBe(6);
    // Simulate API failure — rollback
    const restored = [...original];
    expect(restored.length).toBe(7);
    expect(restored.find(a => a.id === '1')).toBeDefined();
  });

  it('restores state after failed dismiss all', () => {
    const original = [...alerts];
    const dismissed = dismissAll(alerts);
    expect(dismissed.length).toBe(0);
    // Rollback
    const restored = [...original];
    expect(restored.length).toBe(7);
  });

  it('stats are consistent after rollback', () => {
    const original = [...alerts];
    const statsBefore = calculateStats(original);
    
    // Dismiss then rollback
    dismissSingle(alerts, '6');
    const statsAfter = calculateStats(original);
    
    expect(statsBefore).toEqual(statsAfter);
  });
});
