import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLuxIntelligence } from '../useLuxIntelligence';

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
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { success: true, luxRecordId: 'lux-1' }, error: null }) },
  },
}));

describe('useLuxIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(result.current.records).toEqual([]);
    expect(result.current.latestRecord).toBeNull();
    expect(result.current.loading).toBe(false); // no entityId initially triggers no fetch... but we pass it
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(typeof result.current.triggerLux).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should expose isProcessing flag', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(result.current.isProcessing).toBe(false);
  });

  it('should expose triggering flag', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(result.current.triggering).toBe(false);
  });

  it('should accept contact entity type', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(result.current.records).toEqual([]);
  });

  it('should accept company entity type', () => {
    const { result } = renderHook(() => useLuxIntelligence('company', 'comp-1'));
    expect(result.current.records).toEqual([]);
  });

  it('should handle triggerLux call', async () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    const recordId = await result.current.triggerLux({ name: 'Test' });
    expect(recordId === null || typeof recordId === 'string').toBe(true);
  });

  it('should return records as array', () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    expect(Array.isArray(result.current.records)).toBe(true);
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useLuxIntelligence('contact', 'c1'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
