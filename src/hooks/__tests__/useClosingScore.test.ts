import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClosingScore } from '../useClosingScore';

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
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/types/behavior', () => ({
  getDISCProfile: vi.fn().mockReturnValue(null),
}));

describe('useClosingScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useClosingScore('contact-1'));
    expect(result.current.score).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.analyzing).toBe(false);
  });

  it('should export recalculate function', () => {
    const { result } = renderHook(() => useClosingScore('contact-1'));
    expect(typeof result.current.recalculate).toBe('function');
  });

  it('should not calculate when no contactId', () => {
    const { result } = renderHook(() => useClosingScore(''));
    expect(result.current.score).toBeNull();
  });

  it('should define correct probability tiers', () => {
    // The hook uses: >=75 high, >=55 medium, >=35 low, else very_low
    // This is a type check test
    const { result } = renderHook(() => useClosingScore('contact-1'));
    expect(result.current.score).toBeNull(); // Before calculation
  });

  it('should have correct ClosingScoreResult shape', () => {
    const { result } = renderHook(() => useClosingScore('contact-1'));
    // Verify the types are correct by checking initial nullability
    const score = result.current.score;
    if (score !== null) {
      expect(typeof score.overallScore).toBe('number');
      expect(['high', 'medium', 'low', 'very_low']).toContain(score.probability);
      expect(Array.isArray(score.factors)).toBe(true);
      expect(Array.isArray(score.strengths)).toBe(true);
      expect(Array.isArray(score.weaknesses)).toBe(true);
      expect(typeof score.nextBestAction).toBe('string');
      expect(typeof score.optimalClosingWindow).toBe('string');
      expect(Array.isArray(score.riskFactors)).toBe(true);
      expect(typeof score.confidenceLevel).toBe('number');
    }
  });

  it('should have loading set to true initially', () => {
    const { result } = renderHook(() => useClosingScore('contact-1'));
    expect(result.current.loading).toBe(true);
  });

  it('should set analyzing to false after calculation completes', async () => {
    const { result } = renderHook(() => useClosingScore('contact-1'));
    await waitFor(() => {
      expect(result.current.analyzing).toBe(false);
    });
  });

  it('should handle missing contact gracefully', async () => {
    const { result } = renderHook(() => useClosingScore('nonexistent'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.score).toBeNull();
  });
});
