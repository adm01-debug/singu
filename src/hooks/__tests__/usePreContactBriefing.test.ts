import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePreContactBriefing } from '../usePreContactBriefing';

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
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/lib/contact-utils', () => ({
  getContactBehavior: vi.fn().mockReturnValue(null),
}));

describe('usePreContactBriefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(result.current.upcomingBriefings).toEqual([]);
    expect(result.current.activeBriefing).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(typeof result.current.dismissBriefing).toBe('function');
    expect(typeof result.current.showBriefingFor).toBe('function');
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => usePreContactBriefing());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return upcomingBriefings as array', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(Array.isArray(result.current.upcomingBriefings)).toBe(true);
  });

  it('should handle dismissBriefing without error', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(() => result.current.dismissBriefing('some-id')).not.toThrow();
  });

  it('should handle showBriefingFor without error', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(() => result.current.showBriefingFor('some-id')).not.toThrow();
  });

  it('should have null activeBriefing initially', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(result.current.activeBriefing).toBeNull();
  });

  it('should return loading as boolean', () => {
    const { result } = renderHook(() => usePreContactBriefing());
    expect(typeof result.current.loading).toBe('boolean');
  });
});
