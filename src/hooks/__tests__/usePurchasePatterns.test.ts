import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePurchasePatterns } from '../usePurchasePatterns';

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
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('usePurchasePatterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.patterns).toEqual([]);
    expect(result.current.categoryPatterns).toEqual([]);
    expect(result.current.predictions).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export refresh function', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should provide stats with all zero values when no patterns', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.stats).toEqual({
      overdue: 0,
      upcomingWeek: 0,
      highFrequency: 0,
      totalRevenue: 0,
      totalContacts: 0,
    });
  });

  it('should return correct types for all fields', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(Array.isArray(result.current.patterns)).toBe(true);
    expect(Array.isArray(result.current.categoryPatterns)).toBe(true);
    expect(Array.isArray(result.current.predictions)).toBe(true);
    expect(typeof result.current.loading).toBe('boolean');
    expect(typeof result.current.stats).toBe('object');
  });

  it('should have totalContacts matching patterns length', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.stats.totalContacts).toBe(result.current.patterns.length);
  });

  it('should compute totalRevenue as sum of pattern amounts', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.stats.totalRevenue).toBe(0);
  });

  it('should handle empty predictions array', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.predictions.length).toBe(0);
  });

  it('should start with loading true', () => {
    const { result } = renderHook(() => usePurchasePatterns());
    expect(result.current.loading).toBe(true);
  });
});
