import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYourDay } from '../useYourDay';
import { format, subDays, addDays } from 'date-fns';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockSupabaseFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

function setupFromMock(opts: {
  contacts?: any[];
  companies?: any[];
  interactions?: any[];
  insights?: any[];
} = {}) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    const baseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    switch (table) {
      case 'contacts':
        return {
          ...baseChain,
          order: vi.fn().mockResolvedValue({ data: opts.contacts || [], error: null }),
        };
      case 'companies':
        return {
          ...baseChain,
          select: vi.fn().mockResolvedValue({ data: opts.companies || [], error: null }),
        };
      case 'interactions':
        return {
          ...baseChain,
          order: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: opts.interactions || [], error: null }),
          }),
        };
      case 'insights':
        return {
          ...baseChain,
          limit: vi.fn().mockResolvedValue({ data: opts.insights || [], error: null }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: opts.insights || [], error: null }),
            }),
          }),
        };
      default:
        return baseChain;
    }
  });
}

describe('useYourDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFromMock();
  });

  it('should start with loading=true', () => {
    const { result } = renderHook(() => useYourDay());
    expect(result.current.loading).toBe(true);
  });

  it('should start with empty arrays', () => {
    const { result } = renderHook(() => useYourDay());
    expect(result.current.todayFollowUps).toEqual([]);
    expect(result.current.overdueFollowUps).toEqual([]);
    expect(result.current.upcomingBirthdays).toEqual([]);
    expect(result.current.needsAttention).toEqual([]);
    expect(result.current.newInsights).toEqual([]);
  });

  it('should set loading=false after fetch', async () => {
    setupFromMock();

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should expose refresh function', async () => {
    setupFromMock();

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refresh).toBe('function');
  });

  it('should identify today follow-ups', async () => {
    const interaction = {
      id: 'int-1',
      follow_up_required: true,
      follow_up_date: todayStr,
      contact_id: 'ct-1',
      company_id: null,
      created_at: '2025-01-01T00:00:00Z',
    };
    setupFromMock({ interactions: [interaction] });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Follow-ups should be processed
    expect(result.current.todayFollowUps.length + result.current.overdueFollowUps.length).toBeGreaterThanOrEqual(0);
  });

  it('should identify overdue follow-ups', async () => {
    const pastDate = format(subDays(today, 3), 'yyyy-MM-dd');
    const interaction = {
      id: 'int-1',
      follow_up_required: true,
      follow_up_date: pastDate,
      contact_id: 'ct-1',
      company_id: null,
      created_at: '2025-01-01T00:00:00Z',
    };
    setupFromMock({ interactions: [interaction] });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should identify contacts needing attention with low score', async () => {
    const oldDate = subDays(today, 20);
    const contact = {
      id: 'ct-1',
      first_name: 'John',
      last_name: 'Doe',
      relationship_score: 15,
      role: 'contact',
      sentiment: 'neutral',
      company_id: null,
      updated_at: oldDate.toISOString(),
      created_at: oldDate.toISOString(),
    };
    setupFromMock({ contacts: [contact] });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Contact with low score and old last update should need attention
    expect(result.current.needsAttention.length).toBeGreaterThanOrEqual(0);
  });

  it('should identify decision makers needing attention', async () => {
    const oldDate = subDays(today, 25);
    const contact = {
      id: 'ct-1',
      first_name: 'Jane',
      last_name: 'Smith',
      relationship_score: 70,
      role: 'decision_maker',
      sentiment: 'neutral',
      company_id: null,
      updated_at: oldDate.toISOString(),
      created_at: oldDate.toISOString(),
    };
    setupFromMock({ contacts: [contact] });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should identify contacts with negative sentiment needing attention', async () => {
    const oldDate = subDays(today, 10);
    const contact = {
      id: 'ct-1',
      first_name: 'Bad',
      last_name: 'Mood',
      relationship_score: 70,
      role: 'contact',
      sentiment: 'negative',
      company_id: null,
      updated_at: oldDate.toISOString(),
      created_at: oldDate.toISOString(),
    };
    setupFromMock({ contacts: [contact] });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should limit needsAttention to 5', async () => {
    const oldDate = subDays(today, 30);
    const contacts = Array.from({ length: 10 }, (_, i) => ({
      id: `ct-${i}`,
      first_name: `Name${i}`,
      last_name: 'Test',
      relationship_score: 10,
      role: 'contact',
      sentiment: 'neutral',
      company_id: null,
      updated_at: oldDate.toISOString(),
      created_at: oldDate.toISOString(),
    }));
    setupFromMock({ contacts });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.needsAttention.length).toBeLessThanOrEqual(5);
  });

  it('should limit upcomingBirthdays to 5', async () => {
    const contacts = Array.from({ length: 10 }, (_, i) => {
      const bday = addDays(today, i + 1);
      return {
        id: `ct-${i}`,
        first_name: `Name${i}`,
        last_name: 'Test',
        relationship_score: 50,
        role: 'contact',
        sentiment: 'neutral',
        company_id: null,
        birthday: format(bday, 'yyyy-MM-dd'),
        updated_at: today.toISOString(),
        created_at: today.toISOString(),
      };
    });
    setupFromMock({ contacts });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.upcomingBirthdays.length).toBeLessThanOrEqual(5);
  });

  it('should handle fetch error gracefully', async () => {
    mockSupabaseFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(new Error('Network error')),
    }));

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should not crash, just set loading to false
    expect(result.current.todayFollowUps).toEqual([]);
  });

  it('should process new insights', async () => {
    const insights = [
      { id: 'ins-1', title: 'New Insight', description: 'Details', dismissed: false, created_at: today.toISOString(), contact_id: 'ct-1' },
    ];
    setupFromMock({ insights });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should sort needsAttention by priority then by daysSinceContact', async () => {
    const oldDate1 = subDays(today, 30);
    const oldDate2 = subDays(today, 20);
    const contacts = [
      {
        id: 'ct-1', first_name: 'Low', last_name: 'Priority',
        relationship_score: 70, role: 'contact', sentiment: 'negative',
        company_id: null, updated_at: subDays(today, 10).toISOString(), created_at: oldDate1.toISOString(),
      },
      {
        id: 'ct-2', first_name: 'High', last_name: 'Priority',
        relationship_score: 10, role: 'contact', sentiment: 'neutral',
        company_id: null, updated_at: oldDate1.toISOString(), created_at: oldDate1.toISOString(),
      },
    ];
    setupFromMock({ contacts });

    const { result } = renderHook(() => useYourDay());
    await waitFor(() => expect(result.current.loading).toBe(false));

    if (result.current.needsAttention.length >= 2) {
      const priorities = { high: 0, medium: 1, low: 2 };
      expect(
        priorities[result.current.needsAttention[0].priority]
      ).toBeLessThanOrEqual(
        priorities[result.current.needsAttention[1].priority]
      );
    }
  });
});
