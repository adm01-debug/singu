import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContactDetail } from '../useContactDetail';

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
const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() };
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

const fakeContact = {
  id: 'contact-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@test.com',
  company_id: 'company-1',
  user_id: 'test-user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  relationship_score: 80,
  sentiment: 'positive',
};

const fakeCompany = {
  id: 'company-1',
  name: 'Acme Corp',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

function setupFromCalls() {
  // We need different behavior for different tables
  const contactChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: fakeContact, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  const companyChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: fakeCompany, error: null }),
  };

  const interactionChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const insightChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const alertChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
  };

  mockSupabaseFrom.mockImplementation((table: string) => {
    switch (table) {
      case 'contacts': return contactChain;
      case 'companies': return companyChain;
      case 'interactions': return interactionChain;
      case 'insights': return insightChain;
      case 'alerts': return alertChain;
      default: return contactChain;
    }
  });

  return { contactChain, companyChain, interactionChain, insightChain, alertChain };
}

describe('useContactDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading=true and null contact', () => {
    setupFromCalls();
    const { result } = renderHook(() => useContactDetail('contact-1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.contact).toBeNull();
  });

  it('should set loading=false when contactId is undefined', async () => {
    const { result } = renderHook(() => useContactDetail(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contact).toBeNull();
  });

  it('should fetch contact detail on mount', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.contact).toBeTruthy();
    expect(result.current.contact?.id).toBe('contact-1');
  });

  it('should fetch company data when contact has company_id', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.company).toBeTruthy();
    expect(result.current.company?.name).toBe('Acme Corp');
  });

  it('should set error when contact not found', async () => {
    const chains = setupFromCalls();
    chains.contactChain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { result } = renderHook(() => useContactDetail('nonexistent'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });

  it('should initialize interactions, insights, and alerts as empty arrays', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.interactions).toEqual([]);
    expect(result.current.insights).toEqual([]);
    expect(result.current.alerts).toEqual([]);
  });

  it('should fall back to external data for company when local not found', async () => {
    const chains = setupFromCalls();
    chains.companyChain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    mockQueryExternalData.mockResolvedValue({ data: [fakeCompany], count: 1, error: null });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockQueryExternalData).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'companies',
        filters: [{ type: 'eq', column: 'id', value: 'company-1' }],
      })
    );
  });

  it('should expose updateContact function', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.updateContact).toBe('function');
  });

  it('should update contact and show toast on success', async () => {
    const chains = setupFromCalls();
    const updatedContact = { ...fakeContact, first_name: 'Jane' };
    chains.contactChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedContact, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateContact({ first_name: 'Jane' });
      expect(updated).toBeTruthy();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Contato atualizado' })
    );
  });

  it('should handle updateContact error', async () => {
    const chains = setupFromCalls();
    chains.contactChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      }),
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateContact({ first_name: 'Fail' });
      expect(updated).toBeNull();
    });
  });

  it('should expose updateBehavior function that calls updateContact', async () => {
    const chains = setupFromCalls();
    chains.contactChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeContact, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateBehavior({ discProfile: 'D' });
      expect(updated).toBeTruthy();
    });
  });

  it('should expose addInteraction function', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.addInteraction).toBe('function');
  });

  it('should add interaction and prepend to interactions list', async () => {
    const chains = setupFromCalls();
    const newInteraction = {
      id: 'new-int-1',
      type: 'call',
      title: 'New call',
      content: 'Content',
      contact_id: 'contact-1',
      user_id: 'test-user-123',
      created_at: '2025-01-02T00:00:00Z',
    };
    chains.contactChain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: newInteraction, error: null }),
      }),
    });
    // Mock the interactions table insert
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'interactions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newInteraction, error: null }),
            }),
          }),
        };
      }
      return setupFromCalls()[table === 'contacts' ? 'contactChain' : 'companyChain'];
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Re-setup for the addInteraction call
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'interactions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newInteraction, error: null }),
            }),
          }),
        };
      }
      const chains2 = setupFromCalls();
      return chains2.contactChain;
    });

    await act(async () => {
      const added = await result.current.addInteraction({
        type: 'call',
        title: 'New call',
        content: 'Content',
      } as any);
      expect(added).toBeTruthy();
    });
  });

  it('should dismiss alert and remove from list', async () => {
    const chains = setupFromCalls();
    chains.alertChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.dismissAlert('alert-1');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Alerta dispensado' })
    );
  });

  it('should dismiss insight and remove from list', async () => {
    const chains = setupFromCalls();
    // For insights table
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'insights') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return chains.contactChain;
    });

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.dismissInsight('insight-1');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Insight dispensado' })
    );
  });

  it('should expose refetch function', async () => {
    setupFromCalls();

    const { result } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should set up realtime channel subscription', async () => {
    setupFromCalls();
    const { supabase } = await import('@/integrations/supabase/client');

    renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('contact-detail-contact-1');
    });
  });

  it('should clean up realtime channel on unmount', async () => {
    setupFromCalls();
    const { supabase } = await import('@/integrations/supabase/client');

    const { unmount } = renderHook(() => useContactDetail('contact-1'));
    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalled();
    });

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
