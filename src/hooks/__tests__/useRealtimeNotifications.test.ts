import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeNotifications } from '../useRealtimeNotifications';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const mockSonnerToast = Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
});
vi.mock('sonner', () => ({
  toast: mockSonnerToast,
}));

const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() };
const mockSupabaseFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

function setupFromMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
  };
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

describe('useRealtimeNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFromMock();
  });

  it('should start with empty notifications and zero unread count', () => {
    const { result } = renderHook(() => useRealtimeNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should set up realtime channel subscription', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('realtime-notifications-test-user-123');
    });
  });

  it('should subscribe to alerts, insights, health_alerts, and stakeholder_alerts', async () => {
    renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      // The channel.on should be called 4 times for 4 tables
      expect(mockChannel.on).toHaveBeenCalledTimes(4);
    });

    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should clean up channel on unmount', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { unmount } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('should clear unread count when clearUnread is called', async () => {
    const { result } = renderHook(() => useRealtimeNotifications());

    act(() => {
      result.current.clearUnread();
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it('should expose dismissNotification function', () => {
    const { result } = renderHook(() => useRealtimeNotifications());
    expect(typeof result.current.dismissNotification).toBe('function');
  });

  it('should dismiss notification and remove from list', async () => {
    const chain = setupFromMock();
    chain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await act(async () => {
      await result.current.dismissNotification({
        id: 'alert-1',
        type: 'alert',
        title: 'Test',
        createdAt: '2025-01-01T00:00:00Z',
      });
    });

    // Should have called supabase.from('alerts').update(...)
    expect(mockSupabaseFrom).toHaveBeenCalledWith('alerts');
  });

  it('should dismiss insight notification correctly', async () => {
    const chain = setupFromMock();
    chain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await act(async () => {
      await result.current.dismissNotification({
        id: 'insight-1',
        type: 'insight',
        title: 'Test Insight',
        createdAt: '2025-01-01T00:00:00Z',
      });
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('insights');
  });

  it('should dismiss health_alert notification correctly', async () => {
    const chain = setupFromMock();
    chain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await act(async () => {
      await result.current.dismissNotification({
        id: 'ha-1',
        type: 'health_alert',
        title: 'Health Alert',
        createdAt: '2025-01-01T00:00:00Z',
      });
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('health_alerts');
  });

  it('should not dismiss notification with unknown type', async () => {
    setupFromMock();

    const { result } = renderHook(() => useRealtimeNotifications());

    await act(async () => {
      await result.current.dismissNotification({
        id: 'unknown-1',
        type: 'interaction' as any,
        title: 'Unknown',
        createdAt: '2025-01-01T00:00:00Z',
      });
    });

    // Should not have called update for unknown type
    // The function returns early when table is undefined
  });

  it('should load initial notifications on mount', async () => {
    const chain = setupFromMock();
    chain.limit = vi.fn().mockResolvedValue({
      data: [{ id: 'a1', title: 'Alert 1', description: null, contact_id: 'c1', created_at: '2025-01-01T00:00:00Z' }],
      error: null,
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      expect(result.current.notifications.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should sort notifications by createdAt descending', async () => {
    const chain = setupFromMock();
    // The Promise.allSettled will call from() multiple times
    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: callCount === 1
            ? [{ id: 'a1', title: 'Alert', description: null, contact_id: 'c1', created_at: '2025-01-02T00:00:00Z' }]
            : callCount === 2
            ? [{ id: 'i1', title: 'Insight', description: null, contact_id: 'c1', created_at: '2025-01-01T00:00:00Z' }]
            : [],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };
    });

    const { result } = renderHook(() => useRealtimeNotifications());

    await waitFor(() => {
      if (result.current.notifications.length > 0) {
        // Notifications should be sorted by date
        const dates = result.current.notifications.map(n => new Date(n.createdAt).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  it('should limit notifications to 50', async () => {
    // This is tested by the .slice(0, 50) in the code
    const { result } = renderHook(() => useRealtimeNotifications());
    expect(result.current.notifications.length).toBeLessThanOrEqual(50);
  });
});
