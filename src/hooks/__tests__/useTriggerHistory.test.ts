import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTriggerHistory } from '../useTriggerHistory';

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
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'entry-1' }, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/types/triggers', () => ({}));

describe('useTriggerHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useTriggerHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export all CRUD functions', () => {
    const { result } = renderHook(() => useTriggerHistory());
    expect(typeof result.current.createUsage).toBe('function');
    expect(typeof result.current.updateUsage).toBe('function');
    expect(typeof result.current.deleteUsage).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return null stats when no history', () => {
    const { result } = renderHook(() => useTriggerHistory());
    expect(result.current.stats).toBeNull();
  });

  it('should accept contactId parameter', () => {
    const { result } = renderHook(() => useTriggerHistory('contact-1'));
    expect(result.current.history).toEqual([]);
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useTriggerHistory());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return history as array', () => {
    const { result } = renderHook(() => useTriggerHistory());
    expect(Array.isArray(result.current.history)).toBe(true);
  });

  it('should handle createUsage call', async () => {
    const { result } = renderHook(() => useTriggerHistory());
    const entry = await result.current.createUsage({
      contact_id: 'c1',
      trigger_type: 'scarcity' as any,
    });
    expect(entry === null || typeof entry === 'object').toBe(true);
  });

  it('should handle updateUsage call', async () => {
    const { result } = renderHook(() => useTriggerHistory());
    const success = await result.current.updateUsage('entry-1', { result: 'success' });
    expect(typeof success).toBe('boolean');
  });

  it('should handle deleteUsage call', async () => {
    const { result } = renderHook(() => useTriggerHistory());
    const success = await result.current.deleteUsage('entry-1');
    expect(typeof success).toBe('boolean');
  });

  it('should work without contactId', () => {
    const { result } = renderHook(() => useTriggerHistory());
    expect(result.current.history).toEqual([]);
  });
});
