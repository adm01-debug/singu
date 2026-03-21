import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplateNotifications } from '../useTemplateNotifications';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { preferences: null }, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('useTemplateNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default settings', () => {
    const { result } = renderHook(() => useTemplateNotifications());
    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.minSuccessRate).toBe(70);
    expect(result.current.settings.minUsages).toBe(3);
    expect(result.current.settings.discProfiles).toEqual(['D', 'I', 'S', 'C']);
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useTemplateNotifications());
    expect(result.current.loading).toBe(true);
  });

  it('should export updateSettings function', () => {
    const { result } = renderHook(() => useTemplateNotifications());
    expect(typeof result.current.updateSettings).toBe('function');
  });

  it('should export checkForHighPerformers function', () => {
    const { result } = renderHook(() => useTemplateNotifications());
    expect(typeof result.current.checkForHighPerformers).toBe('function');
  });

  it('should resolve loading after settings load', async () => {
    const { result } = renderHook(() => useTemplateNotifications());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle updateSettings call', async () => {
    const { result } = renderHook(() => useTemplateNotifications());
    const success = await result.current.updateSettings({ enabled: false });
    expect(typeof success).toBe('boolean');
  });

  it('should handle checkForHighPerformers call', async () => {
    const { result } = renderHook(() => useTemplateNotifications());
    const data = await result.current.checkForHighPerformers();
    expect(data === null || typeof data === 'object').toBe(true);
  });

  it('should have all 4 DISC profiles in default settings', () => {
    const { result } = renderHook(() => useTemplateNotifications());
    expect(result.current.settings.discProfiles).toHaveLength(4);
    expect(result.current.settings.discProfiles).toContain('D');
    expect(result.current.settings.discProfiles).toContain('I');
    expect(result.current.settings.discProfiles).toContain('S');
    expect(result.current.settings.discProfiles).toContain('C');
  });
});
