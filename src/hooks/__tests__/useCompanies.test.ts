import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCompanies } from '../useCompanies';

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

const mockQueryExternalData = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
vi.mock('@/lib/externalData', () => ({
  queryExternalData: (...args: unknown[]) => mockQueryExternalData(...args),
  mutateExternalData: vi.fn().mockResolvedValue({ data: null, error: null }),
  callExternalFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
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

const fakeExternalCompany = {
  id: 'company-1',
  nome_crm: 'Acme Corp',
  nome_fantasia: 'Acme',
  razao_social: 'Acme Ltda',
  ramo_atividade: 'Technology',
  city: 'SP',
  state: 'SP',
  phone: '11999999',
  email: 'acme@test.com',
  tags_array: ['tech'],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

function setupSupabaseChain(resolvedValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(resolvedValue) });
  mockSupabaseFrom.mockReturnValue(chain);
  return chain;
}

describe('useCompanies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });
  });

  it('should start with loading=true and empty companies', () => {
    const { result } = renderHook(() => useCompanies());
    expect(result.current.loading).toBe(true);
    expect(result.current.companies).toEqual([]);
  });

  it('should fetch and map companies on mount', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [fakeExternalCompany],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies).toHaveLength(1);
    expect(result.current.companies[0].name).toBe('Acme Corp');
  });

  it('should map nome_fantasia when nome_crm is absent', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [{ ...fakeExternalCompany, nome_crm: null }],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].name).toBe('Acme');
  });

  it('should fall back to "Sem nome" when no name fields exist', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [{ ...fakeExternalCompany, nome_crm: null, nome_fantasia: null, razao_social: null }],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].name).toBe('Sem nome');
  });

  it('should set totalCount from response', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [fakeExternalCompany],
      count: 42,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalCount).toBe(42);
  });

  it('should handle fetch error and show destructive toast', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: null,
      count: 0,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should handle null data gracefully', async () => {
    mockQueryExternalData.mockResolvedValue({ data: null, count: 0, error: null });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies).toEqual([]);
  });

  it('should support setSearchTerm and trigger fetchCompanies with search', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('tech');
    });

    await waitFor(() => {
      expect(mockQueryExternalData).toHaveBeenCalledWith(
        expect.objectContaining({
          search: {
            term: 'tech',
            columns: ['nome_crm', 'nome_fantasia', 'razao_social', 'ramo_atividade'],
          },
        })
      );
    });
  });

  it('should not add search param when term is less than 2 chars', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.clearAllMocks();
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });

    act(() => {
      result.current.setSearchTerm('a');
    });

    await waitFor(() => {
      const lastCall = mockQueryExternalData.mock.calls[mockQueryExternalData.mock.calls.length - 1];
      expect(lastCall[0].search).toBeUndefined();
    });
  });

  it('should create a company and prepend to list', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });

    const newCompany = { id: 'new-1', name: 'NewCo', created_at: '2025-01-01', updated_at: '2025-01-01' };
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: newCompany, error: null }),
      }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const created = await result.current.createCompany({ name: 'NewCo' } as any);
      expect(created).toBeTruthy();
      expect(created.name).toBe('NewCo');
    });

    expect(result.current.companies).toHaveLength(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Empresa criada' })
    );
  });

  it('should handle createCompany error', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [], count: 0, error: null });
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const created = await result.current.createCompany({ name: 'Fail' } as any);
      expect(created).toBeNull();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should update a company in the list', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [fakeExternalCompany], count: 1, error: null });
    const updatedCompany = { id: 'company-1', name: 'Updated Corp' };
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedCompany, error: null }),
        }),
      }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateCompany('company-1', { name: 'Updated Corp' });
      expect(updated).toBeTruthy();
    });
  });

  it('should handle updateCompany error', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [fakeExternalCompany], count: 1, error: null });
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateCompany('company-1', { name: 'Fail' });
      expect(updated).toBeNull();
    });
  });

  it('should delete a company from the list', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [fakeExternalCompany], count: 1, error: null });
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.delete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companies).toHaveLength(1);

    await act(async () => {
      const deleted = await result.current.deleteCompany('company-1');
      expect(deleted).toBe(true);
    });

    expect(result.current.companies).toHaveLength(0);
  });

  it('should handle deleteCompany error', async () => {
    mockQueryExternalData.mockResolvedValue({ data: [fakeExternalCompany], count: 1, error: null });
    const chain = setupSupabaseChain({ data: null, error: null });
    chain.delete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
    });
    mockSupabaseFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const deleted = await result.current.deleteCompany('company-1');
      expect(deleted).toBe(false);
    });
  });

  it('should map industry from ramo_atividade', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [fakeExternalCompany],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].industry).toBe('Technology');
  });

  it('should map tags from tags_array', async () => {
    mockQueryExternalData.mockResolvedValue({
      data: [fakeExternalCompany],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].tags).toEqual(['tech']);
  });
});
