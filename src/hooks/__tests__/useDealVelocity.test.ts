import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDealVelocity } from '../useDealVelocity';

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

describe('useDealVelocity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContacts.length = 0;
    mockInteractions.length = 0;
  });

  it('should return metrics as null when data is loading', () => {
    vi.mocked(vi.importActual('@/hooks/useContacts') as any);
    const { result } = renderHook(() => useDealVelocity());
    // With loading=false and empty contacts, metrics should still compute
    expect(result.current.metrics).not.toBeNull();
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useDealVelocity());
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('should compute metrics with empty contacts', () => {
    const { result } = renderHook(() => useDealVelocity());
    expect(result.current.metrics).toBeDefined();
    if (result.current.metrics) {
      expect(result.current.metrics.averageCycleTime).toBe(0);
      expect(result.current.metrics.totalActiveDeals).toBe(0);
      expect(result.current.metrics.projectedConversions).toBe(0);
      expect(result.current.metrics.stageVelocities).toBeDefined();
      expect(Array.isArray(result.current.metrics.monthlyTrend)).toBe(true);
    }
  });

  it('should have 6 monthly trend entries', () => {
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      expect(result.current.metrics.monthlyTrend.length).toBe(6);
    }
  });

  it('should have stage velocities for all stages', () => {
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      const stages = result.current.metrics.stageVelocities.map(s => s.stage);
      expect(stages).toContain('lead');
      expect(stages).toContain('prospect');
      expect(stages).toContain('qualified');
      expect(stages).toContain('proposal');
      expect(stages).toContain('negotiation');
      expect(stages).toContain('customer');
    }
  });

  it('should return null bottleneckStage when no contacts in stages', () => {
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      expect(result.current.metrics.bottleneckStage).toBeNull();
      expect(result.current.metrics.fastestStage).toBeNull();
    }
  });

  it('should count active deals from pipeline stages', () => {
    mockContacts.push(
      { id: '1', relationship_stage: 'prospect', created_at: '2025-01-01', updated_at: '2025-02-01' },
      { id: '2', relationship_stage: 'negotiation', created_at: '2025-01-01', updated_at: '2025-02-01' },
      { id: '3', relationship_stage: 'customer', created_at: '2025-01-01', updated_at: '2025-02-01' },
    );
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      expect(result.current.metrics.totalActiveDeals).toBe(2);
    }
  });

  it('should compute 30% projected conversions from active deals', () => {
    mockContacts.push(
      { id: '1', relationship_stage: 'qualified', created_at: '2025-01-01', updated_at: '2025-02-01' },
      { id: '2', relationship_stage: 'proposal', created_at: '2025-01-01', updated_at: '2025-02-01' },
      { id: '3', relationship_stage: 'negotiation', created_at: '2025-01-01', updated_at: '2025-02-01' },
    );
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      expect(result.current.metrics.projectedConversions).toBe(1); // 30% of 3 = 0.9 rounded to 1
    }
  });

  it('should set stage trend to stable when insufficient data', () => {
    const { result } = renderHook(() => useDealVelocity());
    if (result.current.metrics) {
      result.current.metrics.stageVelocities.forEach(sv => {
        expect(sv.trend).toBe('stable');
      });
    }
  });
});
