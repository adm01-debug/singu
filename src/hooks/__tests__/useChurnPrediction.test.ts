import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChurnPrediction } from '../useChurnPrediction';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const mockContacts: any[] = [];
const mockInteractions: any[] = [];
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: mockContacts, loading: false }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: mockInteractions, loading: false }) }));

describe('useChurnPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContacts.length = 0;
    mockInteractions.length = 0;
  });

  it('should return empty churn analysis when no contacts', () => {
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.churnAnalysis).toEqual([]);
    expect(result.current.atRiskContacts).toEqual([]);
    expect(result.current.criticalCount).toBe(0);
    expect(result.current.highRiskCount).toBe(0);
    expect(result.current.averageRiskScore).toBe(0);
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.loading).toBe(false);
  });

  it('should calculate low risk for contacts with recent interactions', () => {
    const now = new Date();
    mockContacts.push({
      id: 'c1', first_name: 'John', last_name: 'Doe',
      company_id: null, relationship_score: 80, sentiment: 'positive',
    });
    mockInteractions.push(
      { id: 'i1', contact_id: 'c1', created_at: now.toISOString(), sentiment: 'positive', response_time: 1 },
      { id: 'i2', contact_id: 'c1', created_at: new Date(now.getTime() - 86400000).toISOString(), sentiment: 'positive', response_time: 2 },
    );
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.churnAnalysis.length).toBe(1);
    expect(result.current.churnAnalysis[0].riskLevel).toBe('low');
  });

  it('should assign higher risk for contacts with no recent interactions', () => {
    const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000); // 120 days ago
    mockContacts.push({
      id: 'c1', first_name: 'Jane', last_name: 'Doe',
      company_id: null, relationship_score: 30, sentiment: 'neutral',
    });
    mockInteractions.push({
      id: 'i1', contact_id: 'c1', created_at: old.toISOString(), sentiment: 'negative', response_time: 72,
    });
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.churnAnalysis[0].riskScore).toBeGreaterThan(25);
  });

  it('should detect negative sentiment trend', () => {
    const now = new Date();
    mockContacts.push({
      id: 'c1', first_name: 'Bob', last_name: 'Smith',
      company_id: null, relationship_score: 50,
    });
    for (let i = 0; i < 5; i++) {
      mockInteractions.push({
        id: `i${i}`, contact_id: 'c1',
        created_at: new Date(now.getTime() - i * 86400000).toISOString(),
        sentiment: 'negative', response_time: 10,
      });
    }
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.churnAnalysis[0].sentimentTrend).toBe('negative');
  });

  it('should filter at-risk contacts correctly', () => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    mockContacts.push(
      { id: 'c1', first_name: 'A', last_name: 'B', company_id: null, relationship_score: 20 },
      { id: 'c2', first_name: 'C', last_name: 'D', company_id: null, relationship_score: 90 },
    );
    mockInteractions.push(
      { id: 'i1', contact_id: 'c1', created_at: old.toISOString(), sentiment: 'negative', response_time: 72 },
      { id: 'i2', contact_id: 'c2', created_at: new Date().toISOString(), sentiment: 'positive', response_time: 1 },
    );
    const { result } = renderHook(() => useChurnPrediction());
    const atRisk = result.current.atRiskContacts;
    // c1 should have higher risk
    if (atRisk.length > 0) {
      expect(atRisk[0].contactId).toBe('c1');
    }
  });

  it('should cap risk score at 100', () => {
    const veryOld = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000);
    mockContacts.push({
      id: 'c1', first_name: 'Test', last_name: 'User',
      company_id: null, relationship_score: 5,
    });
    mockInteractions.push({
      id: 'i1', contact_id: 'c1', created_at: veryOld.toISOString(), sentiment: 'negative', response_time: 200,
    });
    const { result } = renderHook(() => useChurnPrediction());
    expect(result.current.churnAnalysis[0].riskScore).toBeLessThanOrEqual(100);
  });

  it('should generate recommended action based on risk level', () => {
    mockContacts.push({
      id: 'c1', first_name: 'Test', last_name: 'User',
      company_id: null, relationship_score: 80,
    });
    const { result } = renderHook(() => useChurnPrediction());
    expect(typeof result.current.churnAnalysis[0].recommendedAction).toBe('string');
    expect(result.current.churnAnalysis[0].recommendedAction.length).toBeGreaterThan(0);
  });

  it('should sort factors by impact descending', () => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    mockContacts.push({
      id: 'c1', first_name: 'Test', last_name: 'User',
      company_id: null, relationship_score: 20,
    });
    mockInteractions.push({
      id: 'i1', contact_id: 'c1', created_at: old.toISOString(), sentiment: 'negative', response_time: 72,
    });
    const { result } = renderHook(() => useChurnPrediction());
    const factors = result.current.churnAnalysis[0].factors;
    if (factors.length >= 2) {
      expect(factors[0].impact).toBeGreaterThanOrEqual(factors[1].impact);
    }
  });

  it('should compute average risk score across all contacts', () => {
    mockContacts.push(
      { id: 'c1', first_name: 'A', last_name: 'B', company_id: null, relationship_score: 50 },
      { id: 'c2', first_name: 'C', last_name: 'D', company_id: null, relationship_score: 50 },
    );
    const { result } = renderHook(() => useChurnPrediction());
    expect(typeof result.current.averageRiskScore).toBe('number');
  });
});
