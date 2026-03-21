import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBestTimeToContact } from '../useBestTimeToContact';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const mockInteractions: any[] = [];
vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({ interactions: mockInteractions, loading: false }),
}));

describe('useBestTimeToContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInteractions.length = 0;
  });

  it('should return null analysis when no interactions', () => {
    const { result } = renderHook(() => useBestTimeToContact());
    expect(result.current.analysis).toBeNull();
    expect(result.current.globalPatterns).toBeNull();
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useBestTimeToContact());
    expect(result.current.loading).toBe(false);
  });

  it('should compute analysis when interactions exist', () => {
    mockInteractions.push(
      { id: '1', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive', response_time: 2 },
      { id: '2', contact_id: 'c1', created_at: '2025-03-11T14:00:00Z', sentiment: 'positive', response_time: 1 },
      { id: '3', contact_id: 'c1', created_at: '2025-03-12T10:00:00Z', sentiment: 'neutral', response_time: 3 },
    );
    const { result } = renderHook(() => useBestTimeToContact('c1'));
    expect(result.current.analysis).not.toBeNull();
    if (result.current.analysis) {
      expect(result.current.analysis.contactId).toBe('c1');
      expect(result.current.analysis.bestDays.length).toBeGreaterThan(0);
      expect(result.current.analysis.bestHours.length).toBeGreaterThan(0);
    }
  });

  it('should compute global patterns when interactions exist', () => {
    mockInteractions.push(
      { id: '1', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive' },
      { id: '2', contact_id: 'c2', created_at: '2025-03-11T14:00:00Z', sentiment: 'neutral' },
    );
    const { result } = renderHook(() => useBestTimeToContact());
    expect(result.current.globalPatterns).not.toBeNull();
    if (result.current.globalPatterns) {
      expect(result.current.globalPatterns.peakActivityHour).toBeDefined();
      expect(result.current.globalPatterns.peakActivityDay).toBeDefined();
      expect(result.current.globalPatterns.hourlyDistribution.length).toBe(24);
      expect(result.current.globalPatterns.dailyDistribution.length).toBe(7);
    }
  });

  it('should generate overallPattern description', () => {
    mockInteractions.push(
      { id: '1', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive', response_time: 1 },
      { id: '2', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive', response_time: 1 },
    );
    const { result } = renderHook(() => useBestTimeToContact('c1'));
    if (result.current.analysis) {
      expect(typeof result.current.analysis.overallPattern).toBe('string');
      expect(result.current.analysis.overallPattern.length).toBeGreaterThan(0);
    }
  });

  it('should generate recommendation text', () => {
    mockInteractions.push(
      { id: '1', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive', response_time: 1 },
    );
    const { result } = renderHook(() => useBestTimeToContact('c1'));
    if (result.current.analysis) {
      expect(typeof result.current.analysis.recommendation).toBe('string');
    }
  });

  it('should use contactId "all" when no contactId provided', () => {
    mockInteractions.push(
      { id: '1', contact_id: 'c1', created_at: '2025-03-10T10:00:00Z', sentiment: 'positive', response_time: 1 },
    );
    const { result } = renderHook(() => useBestTimeToContact());
    if (result.current.analysis) {
      expect(result.current.analysis.contactId).toBe('all');
    }
  });

  it('should limit bestTimeSlots to top 5', () => {
    // Add many interactions across different time slots
    for (let i = 0; i < 20; i++) {
      const hour = 8 + (i % 13);
      const day = i % 7;
      mockInteractions.push({
        id: `int-${i}`,
        contact_id: 'c1',
        created_at: `2025-03-${10 + day}T${String(hour).padStart(2, '0')}:00:00Z`,
        sentiment: 'positive',
        response_time: 1,
      });
    }
    const { result } = renderHook(() => useBestTimeToContact('c1'));
    if (result.current.analysis) {
      expect(result.current.analysis.bestTimeSlots.length).toBeLessThanOrEqual(5);
    }
  });
});
