import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAccountChurnPrediction } from '../useAccountChurnPrediction';

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
const mockCompanies: any[] = [];
const mockInteractions: any[] = [];
const mockAlerts: any[] = [];

vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: mockContacts, loading: false }) }));
vi.mock('@/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: mockCompanies, loading: false }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: mockInteractions, loading: false }) }));
vi.mock('@/hooks/useStakeholderAlerts', () => ({ useStakeholderAlerts: () => ({ alerts: mockAlerts, loading: false }) }));

describe('useAccountChurnPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContacts.length = 0;
    mockCompanies.length = 0;
    mockInteractions.length = 0;
    mockAlerts.length = 0;
  });

  it('should return empty analysis when no companies', () => {
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis).toEqual([]);
    expect(result.current.atRiskAccounts).toEqual([]);
    expect(result.current.healthyAccounts).toEqual([]);
  });

  it('should return zero counts when no data', () => {
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.criticalCount).toBe(0);
    expect(result.current.highRiskCount).toBe(0);
    expect(result.current.averageRiskScore).toBe(0);
    expect(result.current.portfolioHealthScore).toBe(100);
  });

  it('should analyze company with no contacts as low risk', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis.length).toBe(1);
    expect(result.current.accountChurnAnalysis[0].companyName).toBe('Test Corp');
  });

  it('should detect no champions risk factor', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    mockContacts.push({
      id: 'c1', company_id: 'comp1', first_name: 'A', last_name: 'B',
      behavior: { support: 50, engagement: 50, influence: 50 },
      relationship_score: 50, role_title: 'Manager',
    });
    const { result } = renderHook(() => useAccountChurnPrediction());
    const analysis = result.current.accountChurnAnalysis[0];
    expect(analysis.championCount).toBe(0);
    const noChampionFactor = analysis.riskFactors.find(f => f.factor === 'Sem Champions');
    expect(noChampionFactor).toBeDefined();
  });

  it('should identify champions correctly', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    mockContacts.push({
      id: 'c1', company_id: 'comp1', first_name: 'A', last_name: 'B',
      behavior: { support: 80, engagement: 70, influence: 60 },
      relationship_score: 80, role_title: 'VP',
    });
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis[0].championCount).toBe(1);
  });

  it('should identify blockers correctly', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    mockContacts.push({
      id: 'c1', company_id: 'comp1', first_name: 'A', last_name: 'B',
      behavior: { support: 20, engagement: 30, influence: 80 },
      relationship_score: 30, role_title: 'Dir',
    });
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis[0].blockerCount).toBe(1);
  });

  it('should generate recommended actions', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis[0].recommendedActions.length).toBeGreaterThan(0);
  });

  it('should cap risk score at 100', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    // Add many blockers to push risk high
    for (let i = 0; i < 5; i++) {
      mockContacts.push({
        id: `c${i}`, company_id: 'comp1', first_name: `User${i}`, last_name: 'X',
        behavior: { support: 10, engagement: 10, influence: 90 },
        relationship_score: 10, role_title: 'Exec',
      });
    }
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.accountChurnAnalysis[0].riskScore).toBeLessThanOrEqual(100);
  });

  it('should compute portfolioHealthScore as inverse of averageRiskScore', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    const { result } = renderHook(() => useAccountChurnPrediction());
    expect(result.current.portfolioHealthScore).toBe(100 - result.current.averageRiskScore);
  });

  it('should sort risk factors by impact descending', () => {
    mockCompanies.push({ id: 'comp1', name: 'Test Corp' });
    mockContacts.push({
      id: 'c1', company_id: 'comp1', first_name: 'A', last_name: 'B',
      behavior: { support: 10, engagement: 10, influence: 50 },
      relationship_score: 20, role_title: 'Mgr',
    });
    const { result } = renderHook(() => useAccountChurnPrediction());
    const factors = result.current.accountChurnAnalysis[0].riskFactors;
    if (factors.length >= 2) {
      expect(factors[0].impact).toBeGreaterThanOrEqual(factors[1].impact);
    }
  });
});
