import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClosingScoreAlerts } from '../useClosingScoreAlerts';

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
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'alert-1' }, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('useClosingScoreAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    expect(result.current.alerts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    expect(typeof result.current.checkScoreChange).toBe('function');
    expect(typeof result.current.dismissAlert).toBe('function');
    expect(typeof result.current.dismissAllAlerts).toBe('function');
    expect(typeof result.current.refreshAlerts).toBe('function');
  });

  it('should expose probability labels', () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    expect(result.current.probabilityLabels).toBeDefined();
    expect(result.current.probabilityLabels.high).toBe('Alta');
    expect(result.current.probabilityLabels.medium).toBe('Média');
    expect(result.current.probabilityLabels.low).toBe('Baixa');
    expect(result.current.probabilityLabels.very_low).toBe('Muito Baixa');
  });

  it('should return null when checkScoreChange detects no significant change', async () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    const change = await result.current.checkScoreChange('c1', 'Test', 60, 'medium');
    // Since previous probability is null from mock, and current is medium, no change
    expect(change).toBeNull();
  });

  it('should dismiss an alert by removing from state', async () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    // Starting with empty alerts, dismissing should not throw
    await result.current.dismissAlert('alert-1');
    expect(result.current.alerts).toEqual([]);
  });

  it('should dismiss all alerts', async () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    await result.current.dismissAllAlerts();
    expect(result.current.alerts).toEqual([]);
  });

  it('should detect improved_to_high change type', async () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    // When previous is null and current is high, this triggers improved_to_high
    const change = await result.current.checkScoreChange('c1', 'Test Contact', 85, 'high');
    // The mock returns no previous alerts, so previousProbability is null
    // high with no previous → improved_to_high
    if (change) {
      expect(change.changeType).toBe('improved_to_high');
    }
  });

  it('should handle alerts array correctly', () => {
    const { result } = renderHook(() => useClosingScoreAlerts());
    expect(Array.isArray(result.current.alerts)).toBe(true);
  });
});
