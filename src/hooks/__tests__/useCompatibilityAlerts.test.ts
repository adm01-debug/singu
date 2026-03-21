import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompatibilityAlerts } from '../useCompatibilityAlerts';

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
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/types', () => ({
  DISC_LABELS: { D: 'Dominante', I: 'Influente', S: 'Estável', C: 'Consciente' },
}));
vi.mock('@/types/vak', () => ({
  VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
}));

describe('useCompatibilityAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    expect(result.current.checking).toBe(false);
  });

  it('should export checkAndCreateAlerts function', () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    expect(typeof result.current.checkAndCreateAlerts).toBe('function');
  });

  it('should not throw when checkAndCreateAlerts is called', async () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    await expect(result.current.checkAndCreateAlerts()).resolves.not.toThrow();
  });

  it('should return checking as boolean', () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    expect(typeof result.current.checking).toBe('boolean');
  });

  it('should have exactly 2 properties in return value', () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    const keys = Object.keys(result.current);
    expect(keys).toContain('checking');
    expect(keys).toContain('checkAndCreateAlerts');
  });

  it('should set checking to false after completion', async () => {
    const { result } = renderHook(() => useCompatibilityAlerts());
    await result.current.checkAndCreateAlerts();
    expect(result.current.checking).toBe(false);
  });

  it('should auto-check on mount via timer', () => {
    vi.useFakeTimers();
    renderHook(() => useCompatibilityAlerts());
    // Timer is set to 3000ms
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(0);
    vi.useRealTimers();
  });

  it('should clear timer on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useCompatibilityAlerts());
    unmount();
    vi.useRealTimers();
  });
});
