import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const mockIsPushSupported = vi.fn().mockReturnValue(false);
const mockSubscribeToPush = vi.fn().mockResolvedValue(null);
const mockUnsubscribeFromPush = vi.fn().mockResolvedValue(true);
const mockGetSubscriptionStatus = vi.fn().mockResolvedValue({ isSubscribed: false });
const mockRegisterServiceWorker = vi.fn();

vi.mock('@/lib/pushNotifications', () => ({
  isPushSupported: () => mockIsPushSupported(),
  subscribeToPush: () => mockSubscribeToPush(),
  unsubscribeFromPush: () => mockUnsubscribeFromPush(),
  getSubscriptionStatus: () => mockGetSubscriptionStatus(),
  registerServiceWorker: () => mockRegisterServiceWorker(),
}));

const mockSupabaseFrom = vi.fn();
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } }, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: () => mockGetUser(),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPushSupported.mockReturnValue(false);
  });

  it('should initialize with default permission state', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permissionState.supported).toBe(false);
    expect(result.current.permissionState.permission).toBe('default');
  });

  it('should not be subscribed initially', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should not be loading initially', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isLoading).toBe(false);
  });

  it('should check push support on mount', async () => {
    renderHook(() => useNotifications());
    await waitFor(() => {
      expect(mockIsPushSupported).toHaveBeenCalled();
    });
  });

  it('should register service worker when push is supported', async () => {
    mockIsPushSupported.mockReturnValue(true);
    // Need to mock Notification globally
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });

    renderHook(() => useNotifications());
    await waitFor(() => {
      expect(mockRegisterServiceWorker).toHaveBeenCalled();
    });
  });

  it('should return false from requestPermission when not supported', async () => {
    mockIsPushSupported.mockReturnValue(false);

    const { result } = renderHook(() => useNotifications());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted!).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should expose showNotification function', () => {
    const { result } = renderHook(() => useNotifications());
    expect(typeof result.current.showNotification).toBe('function');
  });

  it('should expose checkFollowUpAlerts function', () => {
    const { result } = renderHook(() => useNotifications());
    expect(typeof result.current.checkFollowUpAlerts).toBe('function');
  });

  it('should expose checkBirthdayAlerts function', () => {
    const { result } = renderHook(() => useNotifications());
    expect(typeof result.current.checkBirthdayAlerts).toBe('function');
  });

  it('should expose checkStakeholderAlerts function', () => {
    const { result } = renderHook(() => useNotifications());
    expect(typeof result.current.checkStakeholderAlerts).toBe('function');
  });

  it('should expose unsubscribe function', () => {
    const { result } = renderHook(() => useNotifications());
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('should call unsubscribeFromPush and update state on unsubscribe', async () => {
    mockUnsubscribeFromPush.mockResolvedValue(true);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      const success = await result.current.unsubscribe();
      expect(success).toBe(true);
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it('should handle unsubscribe failure', async () => {
    mockUnsubscribeFromPush.mockResolvedValue(false);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      const success = await result.current.unsubscribe();
      expect(success).toBe(false);
    });
  });

  it('should not check follow-up alerts when permission is not granted', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.checkFollowUpAlerts();
    });

    // Should not have called supabase.auth.getUser since permission is not granted
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should not check birthday alerts when permission is not granted', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.checkBirthdayAlerts();
    });

    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should check subscription status when push is supported and permission granted', async () => {
    mockIsPushSupported.mockReturnValue(true);
    mockGetSubscriptionStatus.mockResolvedValue({ isSubscribed: true });
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockGetSubscriptionStatus).toHaveBeenCalled();
    });
  });
});
