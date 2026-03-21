import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInteractions } from '../useInteractions';

const mockToast = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));
vi.mock('@/hooks/useNLPAutoAnalysis', () => ({
  useNLPAutoAnalysis: () => ({ triggerAnalysis: vi.fn().mockResolvedValue(undefined) }),
}));

const mockSupabaseFrom = vi.fn();
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: (...args: unknown[]) => mockFunctionsInvoke(...args) },
  },
}));

const fakeInteraction = {
  id: 'int-1',
  type: 'call',
  title: 'Follow-up call',
  content: 'Discussed pricing',
  sentiment: 'positive',
  tags: [],
  contact_id: 'contact-1',
  company_id: 'company-1',
  user_id: 'test-user-123',
  created_at: '2025-01-01T00:00:00Z',
  transcription: null,
  duration: null,
  attachments: null,
  audio_url: null,
  key_insights: null,
  initiated_by: 'us',
  response_time: null,
  follow_up_required: false,
  follow_up_date: null,
  emotion_analysis: null,
};

function setupQueryChain(data: unknown[], count = 0, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, error, count }),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

describe('useInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupQueryChain([], 0);
  });

  it('should start with loading=true and empty interactions', () => {
    const { result } = renderHook(() => useInteractions());
    expect(result.current.loading).toBe(true);
    expect(result.current.interactions).toEqual([]);
  });

  it('should fetch interactions on mount', async () => {
    setupQueryChain([fakeInteraction], 1);

    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.interactions).toHaveLength(1);
    expect(result.current.interactions[0].id).toBe('int-1');
  });

  it('should filter by contactId when provided', async () => {
    const chain = setupQueryChain([], 0);

    renderHook(() => useInteractions('contact-1'));

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('contact_id', 'contact-1');
    });
  });

  it('should filter by companyId when provided', async () => {
    const chain = setupQueryChain([], 0);

    renderHook(() => useInteractions(undefined, 'company-1'));

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('company_id', 'company-1');
    });
  });

  it('should filter by both contactId and companyId', async () => {
    const chain = setupQueryChain([], 0);

    renderHook(() => useInteractions('contact-1', 'company-1'));

    await waitFor(() => {
      expect(chain.eq).toHaveBeenCalledWith('contact_id', 'contact-1');
      expect(chain.eq).toHaveBeenCalledWith('company_id', 'company-1');
    });
  });

  it('should handle fetch error and show toast', async () => {
    setupQueryChain([], 0, new Error('Fetch failed'));

    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should set hasMore=true when pageSize items returned', async () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ ...fakeInteraction, id: `int-${i}` }));
    setupQueryChain(many, 100);

    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  it('should set hasMore=false when fewer than pageSize items returned', async () => {
    setupQueryChain([fakeInteraction], 1);

    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(false);
  });

  it('should create an interaction and prepend to list', async () => {
    setupQueryChain([], 0);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      single: vi.fn().mockResolvedValue({ data: fakeInteraction, error: null }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeInteraction, error: null }),
        }),
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const created = await result.current.createInteraction({
        type: 'call',
        title: 'Test',
        content: 'Test content',
        contact_id: 'contact-1',
      } as any);
      expect(created).toBeTruthy();
    });

    expect(result.current.interactions).toHaveLength(1);
  });

  it('should return null from createInteraction on error', async () => {
    setupQueryChain([], 0);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const created = await result.current.createInteraction({ type: 'call', title: 'Test', content: 'x' } as any);
      expect(created).toBeNull();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should update an interaction in the list', async () => {
    setupQueryChain([fakeInteraction], 1);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedInt = { ...fakeInteraction, title: 'Updated' };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [fakeInteraction], error: null, count: 1 }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedInt, error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const updated = await result.current.updateInteraction('int-1', { title: 'Updated' });
      expect(updated).toBeTruthy();
      expect(updated.title).toBe('Updated');
    });
  });

  it('should handle updateInteraction error', async () => {
    setupQueryChain([fakeInteraction], 1);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [fakeInteraction], error: null, count: 1 }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const updated = await result.current.updateInteraction('int-1', { title: 'Fail' });
      expect(updated).toBeNull();
    });
  });

  it('should delete an interaction from the list', async () => {
    setupQueryChain([fakeInteraction], 1);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.interactions).toHaveLength(1);

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [fakeInteraction], error: null, count: 1 }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const deleted = await result.current.deleteInteraction('int-1');
      expect(deleted).toBe(true);
    });

    expect(result.current.interactions).toHaveLength(0);
  });

  it('should handle deleteInteraction error', async () => {
    setupQueryChain([fakeInteraction], 1);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [fakeInteraction], error: null, count: 1 }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      const deleted = await result.current.deleteInteraction('int-1');
      expect(deleted).toBe(false);
    });
  });

  it('should expose loadMore function', async () => {
    setupQueryChain([], 0);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should handle null data from fetch', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.interactions).toEqual([]);
  });

  it('should trigger DISC analysis on create for long content', async () => {
    setupQueryChain([], 0);
    const { result } = renderHook(() => useInteractions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const longContent = 'x'.repeat(200);
    const createdInt = { ...fakeInteraction, content: longContent, contact_id: 'contact-1' };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createdInt, error: null }),
        }),
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    await act(async () => {
      await result.current.createInteraction({
        type: 'call',
        title: 'Test',
        content: longContent,
        contact_id: 'contact-1',
      } as any);
    });

    // DISC analysis is triggered via supabase.functions.invoke
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('disc-analyzer', expect.any(Object));
  });
});
