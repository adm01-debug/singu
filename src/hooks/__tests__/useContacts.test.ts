import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

const { mockToast, mockQueryExternalData, mockSupabaseFrom } = vi.hoisted(() => {
  const mockToast = vi.fn();
  const mockQueryExternalData = vi.fn();
  const mockSupabaseFrom = vi.fn();
  return { mockToast, mockQueryExternalData, mockSupabaseFrom };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: (...args: unknown[]) => mockQueryExternalData(...args),
  mutateExternalData: vi.fn(), callExternalFunction: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

import { useContacts } from '../useContacts';

const fakeContact = {
  id: 'contact-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com',
  phone: '123456', role: 'contact', company_id: 'company-1', relationship_score: 75,
  sentiment: 'positive', tags: ['vip'], avatar_url: null,
  updated_at: '2025-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z', user_id: 'test-user-123',
};

function supaChain(overrides: Record<string, any> = {}) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) }),
    delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    ...overrides,
  };
}

async function renderAndWait(companyId?: string) {
  const hook = renderHook(() => useContacts(companyId));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useContacts', () => {
  afterEach(() => { cleanup(); });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: successful empty fetch
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [], count: 0, error: null }));
    mockSupabaseFrom.mockImplementation(() => supaChain());
  });

  it('should start with loading=true and empty contacts', () => {
    const { result } = renderHook(() => useContacts());
    expect(result.current.loading).toBe(true);
    expect(result.current.contacts).toEqual([]);
  });

  it('should fetch contacts on mount and set loading=false', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.contacts).toHaveLength(1);
  });

  it('should call queryExternalData with correct table and range', async () => {
    await renderAndWait();
    expect(mockQueryExternalData).toHaveBeenCalledWith(expect.objectContaining({
      table: 'contacts', range: { from: 0, to: 49 },
    }));
  });

  it('should pass companyId filter when provided', async () => {
    await renderAndWait('company-1');
    expect(mockQueryExternalData).toHaveBeenCalledWith(
      expect.objectContaining({ filters: [{ type: 'eq', column: 'company_id', value: 'company-1' }] })
    );
  });

  it('should set hasMore=true when 50 items returned', async () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ ...fakeContact, id: `c-${i}` }));
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: many, count: 100, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.hasMore).toBe(true);
    expect(result.current.contacts).toHaveLength(50);
  });

  it('should set hasMore=false when fewer than 50 items', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.hasMore).toBe(false);
  });

  it('should handle fetch error and show destructive toast', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: null, count: 0, error: new Error('fail') }));
    const { result } = await renderAndWait();
    expect(result.current.contacts).toEqual([]);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('should handle null data gracefully', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: null, count: 0, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.contacts).toEqual([]);
  });

  it('should create a contact and prepend to list', async () => {
    const { result } = await renderAndWait();
    mockSupabaseFrom.mockImplementation(() => supaChain({
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: fakeContact, error: null }) }) }),
    }));

    await act(async () => {
      const c = await result.current.createContact({ first_name: 'John', last_name: 'Doe' } as any);
      expect(c).toBeTruthy();
    });
    expect(result.current.contacts).toHaveLength(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Contato criado' }));
  });

  it('should handle createContact error', async () => {
    const { result } = await renderAndWait();
    mockSupabaseFrom.mockImplementation(() => supaChain({
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }) }) }),
    }));

    await act(async () => {
      expect(await result.current.createContact({ first_name: 'Test' } as any)).toBeNull();
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('should update a contact in the list', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();

    const updated = { ...fakeContact, first_name: 'Jane' };
    mockSupabaseFrom.mockImplementation(() => supaChain({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: updated, error: null }) }) }) }),
    }));

    await act(async () => {
      const u = await result.current.updateContact('contact-1', { first_name: 'Jane' });
      expect(u.first_name).toBe('Jane');
    });
  });

  it('should handle updateContact error', async () => {
    const { result } = await renderAndWait();
    mockSupabaseFrom.mockImplementation(() => supaChain({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }) }) }) }),
    }));

    await act(async () => {
      expect(await result.current.updateContact('x', { first_name: 'F' })).toBeNull();
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('should delete a contact from the list', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.contacts).toHaveLength(1);

    mockSupabaseFrom.mockImplementation(() => supaChain({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }));

    await act(async () => { expect(await result.current.deleteContact('contact-1')).toBe(true); });
    expect(result.current.contacts).toHaveLength(0);
  });

  it('should handle deleteContact error', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();

    mockSupabaseFrom.mockImplementation(() => supaChain({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) }),
    }));

    await act(async () => { expect(await result.current.deleteContact('contact-1')).toBe(false); });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('should expose loadMore function', async () => {
    const { result } = await renderAndWait();
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should not loadMore when hasMore is false', async () => {
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [fakeContact], count: 1, error: null }));
    const { result } = await renderAndWait();
    const calls = mockQueryExternalData.mock.calls.length;
    act(() => { result.current.loadMore(); });
    expect(mockQueryExternalData.mock.calls.length).toBe(calls);
  });

  it('should append contacts on loadMore', async () => {
    const page1 = Array.from({ length: 50 }, (_, i) => ({ ...fakeContact, id: `c-${i}` }));
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: page1, count: 100, error: null }));
    const { result } = await renderAndWait();
    expect(result.current.contacts).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);

    const page2 = [{ ...fakeContact, id: 'c-50' }];
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: page2, count: 100, error: null }));
    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contacts).toHaveLength(51);
  });

  it('should expose all CRUD functions', async () => {
    const { result } = await renderAndWait();
    expect(typeof result.current.createContact).toBe('function');
    expect(typeof result.current.updateContact).toBe('function');
    expect(typeof result.current.deleteContact).toBe('function');
    expect(typeof result.current.fetchContacts).toBe('function');
  });
});
