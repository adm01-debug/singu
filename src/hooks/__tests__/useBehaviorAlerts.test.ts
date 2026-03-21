import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBehaviorAlerts } from '../useBehaviorAlerts';

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
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      not: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('useBehaviorAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(result.current.alerts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(typeof result.current.fetchAlerts).toBe('function');
    expect(typeof result.current.detectNewAlerts).toBe('function');
    expect(typeof result.current.dismissAlert).toBe('function');
    expect(typeof result.current.markActionTaken).toBe('function');
  });

  it('should expose ALERT_TYPE_CONFIG', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(result.current.ALERT_TYPE_CONFIG).toBeDefined();
    expect(result.current.ALERT_TYPE_CONFIG.sentiment_drop).toBeDefined();
    expect(result.current.ALERT_TYPE_CONFIG.churn_risk).toBeDefined();
    expect(result.current.ALERT_TYPE_CONFIG.communication_gap).toBeDefined();
    expect(result.current.ALERT_TYPE_CONFIG.positive_momentum).toBeDefined();
  });

  it('should have 7 alert type configurations', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    const types = Object.keys(result.current.ALERT_TYPE_CONFIG);
    expect(types.length).toBe(7);
  });

  it('should compute empty stats when no alerts', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.critical).toBe(0);
    expect(result.current.stats.high).toBe(0);
    expect(result.current.stats.medium).toBe(0);
    expect(result.current.stats.low).toBe(0);
  });

  it('should have correct default severities', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(result.current.ALERT_TYPE_CONFIG.churn_risk.defaultSeverity).toBe('high');
    expect(result.current.ALERT_TYPE_CONFIG.relationship_score_drop.defaultSeverity).toBe('high');
    expect(result.current.ALERT_TYPE_CONFIG.positive_momentum.defaultSeverity).toBe('low');
    expect(result.current.ALERT_TYPE_CONFIG.sentiment_drop.defaultSeverity).toBe('medium');
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return alerts as array', () => {
    const { result } = renderHook(() => useBehaviorAlerts());
    expect(Array.isArray(result.current.alerts)).toBe(true);
  });
});
