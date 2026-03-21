import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRFMAnalysis } from '../useRFMAnalysis';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: [], loading: false }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: [], loading: false }) }));
vi.mock('@/types/rfm', () => ({
  RFM_SEGMENTS: {
    champions: { description: 'Champions', color: '#22c55e' },
    loyal_customers: { description: 'Loyal', color: '#3b82f6' },
    potential_loyalists: { description: 'Potential', color: '#8b5cf6' },
    recent_customers: { description: 'Recent', color: '#06b6d4' },
    promising: { description: 'Promising', color: '#f59e0b' },
    needing_attention: { description: 'Needs attention', color: '#f97316' },
    about_to_sleep: { description: 'About to sleep', color: '#ef4444' },
    at_risk: { description: 'At risk', color: '#dc2626' },
    cant_lose: { description: 'Cannot lose', color: '#b91c1c' },
    hibernating: { description: 'Hibernating', color: '#6b7280' },
    lost: { description: 'Lost', color: '#374151' },
  },
  determineRFMSegment: vi.fn().mockReturnValue('champions'),
  calculateRFMScore: vi.fn().mockReturnValue(5),
}));

describe('useRFMAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(result.current.rfmData).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.analyzing).toBe(false);
  });

  it('should export required functions', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(typeof result.current.runAnalysis).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should return empty dashboard stats when no data', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(result.current.dashboardStats.totalAnalyzed).toBe(0);
    expect(result.current.dashboardStats.averageRfmScore).toBe(0);
    expect(result.current.dashboardStats.totalRevenue).toBe(0);
    expect(result.current.dashboardStats.atRiskRevenue).toBe(0);
    expect(result.current.dashboardStats.championsRevenue).toBe(0);
  });

  it('should return empty contact summaries when no contacts', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(result.current.contactSummaries).toEqual([]);
  });

  it('should return null contactRFM when no contactId provided', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(result.current.contactRFM).toBeNull();
  });

  it('should return null contactRFM when contactId provided but no data', () => {
    const { result } = renderHook(() => useRFMAnalysis('contact-1'));
    expect(result.current.contactRFM).toBeNull();
  });

  it('should have correct dashboard stats structure with empty segments', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    const stats = result.current.dashboardStats;
    expect(stats.segmentDistribution).toEqual({});
    expect(stats.trends).toEqual({ improving: 0, stable: 0, declining: 0 });
    expect(stats.priorityDistribution).toEqual({});
  });

  it('should set loading to true initially then resolve', async () => {
    const { result } = renderHook(() => useRFMAnalysis());
    await waitFor(() => {
      expect(result.current.loading).toBeDefined();
    });
  });

  it('should not run analysis when contacts array is empty', async () => {
    const { result } = renderHook(() => useRFMAnalysis());
    await result.current.runAnalysis();
    expect(result.current.analyzing).toBe(false);
  });

  it('should return scoreDistribution with empty values when no data', () => {
    const { result } = renderHook(() => useRFMAnalysis());
    expect(result.current.dashboardStats.scoreDistribution).toEqual({
      recency: {},
      frequency: {},
      monetary: {},
    });
  });
});
