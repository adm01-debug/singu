import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStakeholderAlerts } from '../useStakeholderAlerts';

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
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } }) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/lib/pushNotifications', () => ({
  isPushSupported: vi.fn().mockReturnValue(false),
  getSubscriptionStatus: vi.fn().mockResolvedValue({ isSubscribed: false }),
}));

describe('useStakeholderAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    expect(result.current.alerts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    expect(typeof result.current.checkForChanges).toBe('function');
    expect(typeof result.current.dismissAlert).toBe('function');
    expect(typeof result.current.dismissAllAlerts).toBe('function');
    expect(typeof result.current.refreshAlerts).toBe('function');
  });

  it('should expose ALERT_TYPES constants', () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    expect(result.current.ALERT_TYPES.BLOCKER_IDENTIFIED).toBe('blocker_identified');
    expect(result.current.ALERT_TYPES.CHAMPION_DISENGAGING).toBe('champion_disengaging');
    expect(result.current.ALERT_TYPES.SUPPORT_DROPPED).toBe('support_dropped');
    expect(result.current.ALERT_TYPES.QUADRANT_CHANGED).toBe('quadrant_changed');
  });

  it('should expose SEVERITY_LEVELS constants', () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    expect(result.current.SEVERITY_LEVELS.LOW).toBe('low');
    expect(result.current.SEVERITY_LEVELS.MEDIUM).toBe('medium');
    expect(result.current.SEVERITY_LEVELS.HIGH).toBe('high');
    expect(result.current.SEVERITY_LEVELS.CRITICAL).toBe('critical');
  });

  it('should accept companyId parameter', () => {
    const { result } = renderHook(() => useStakeholderAlerts('company-1'));
    expect(result.current.alerts).toEqual([]);
  });

  it('should return alerts as array', () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    expect(Array.isArray(result.current.alerts)).toBe(true);
  });

  it('should handle checkForChanges with new contact', async () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    // First time check - should just store metrics
    await result.current.checkForChanges('c1', 'John Doe', null, {
      power: 5,
      interest: 5,
      influence: 5,
      support: 50,
      engagement: 50,
      quadrant: 'monitor',
      riskLevel: 'low',
    });
    // Should not throw
    expect(true).toBe(true);
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useStakeholderAlerts());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
