import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClosingScoreRanking } from '../useClosingScoreRanking';

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
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/lib/contact-utils', () => ({
  getDISCProfile: vi.fn().mockReturnValue(null),
}));

describe('useClosingScoreRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    expect(result.current.rankings).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should export refresh function', () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should compute empty stats when no rankings', () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    expect(result.current.stats.totalContacts).toBe(0);
    expect(result.current.stats.highProbability).toBe(0);
    expect(result.current.stats.mediumProbability).toBe(0);
    expect(result.current.stats.lowProbability).toBe(0);
    expect(result.current.stats.veryLowProbability).toBe(0);
    expect(result.current.stats.averageScore).toBe(0);
  });

  it('should accept probability filter', () => {
    const { result } = renderHook(() => useClosingScoreRanking('high'));
    expect(result.current.rankings).toEqual([]);
  });

  it('should accept period filter', () => {
    const { result } = renderHook(() => useClosingScoreRanking('all', '30d'));
    expect(result.current.rankings).toEqual([]);
  });

  it('should have refreshing state', () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    expect(result.current.refreshing).toBe(false);
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return rankings as array', () => {
    const { result } = renderHook(() => useClosingScoreRanking());
    expect(Array.isArray(result.current.rankings)).toBe(true);
  });

  it('should support all period filter options', () => {
    const { result: r7 } = renderHook(() => useClosingScoreRanking('all', '7d'));
    const { result: r30 } = renderHook(() => useClosingScoreRanking('all', '30d'));
    const { result: r90 } = renderHook(() => useClosingScoreRanking('all', '90d'));
    const { result: rAll } = renderHook(() => useClosingScoreRanking('all', 'all'));
    expect(r7.current.rankings).toEqual([]);
    expect(r30.current.rankings).toEqual([]);
    expect(r90.current.rankings).toEqual([]);
    expect(rAll.current.rankings).toEqual([]);
  });
});
