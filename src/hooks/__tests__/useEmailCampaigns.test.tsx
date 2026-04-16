import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useEmailCampaigns } from '../useEmailCampaigns';

// In-memory mock store
const store = {
  campaigns: [] as any[],
  recipients: [] as any[],
  contacts: [] as any[],
  user: { id: 'user-test' } as any,
};

const fromMock = vi.fn((table: string) => {
  if (table === 'email_campaigns') {
    return {
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: store.campaigns, error: null }),
        }),
      }),
      insert: (row: any) => ({
        select: () => ({
          single: () => {
            const rec = { id: 'new-' + Math.random(), ...row, total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 };
            store.campaigns.push(rec);
            return Promise.resolve({ data: rec, error: null });
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (_col: string, id: string) => {
          const i = store.campaigns.findIndex(c => c.id === id);
          if (i >= 0) store.campaigns[i] = { ...store.campaigns[i], ...updates };
          return Promise.resolve({ data: null, error: null });
        },
      }),
      delete: () => ({
        eq: (_c: string, id: string) => {
          store.campaigns = store.campaigns.filter(c => c.id !== id);
          return Promise.resolve({ data: null, error: null });
        },
      }),
    };
  }
  if (table === 'contacts') {
    return {
      select: () => ({
        eq: () => ({
          not: () => Promise.resolve({ data: store.contacts, error: null }),
        }),
      }),
    };
  }
  if (table === 'campaign_recipients') {
    return {
      select: () => ({
        eq: (_col: string, cid: string) =>
          Promise.resolve({ data: store.recipients.filter(r => r.campaign_id === cid), error: null }),
      }),
      insert: (rows: any[]) => {
        store.recipients.push(...rows);
        return Promise.resolve({ data: rows, error: null });
      },
    };
  }
  return {} as any;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (t: string) => fromMock(t),
    auth: { getUser: () => Promise.resolve({ data: { user: store.user } }) },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  store.campaigns = [];
  store.recipients = [];
  store.contacts = [];
  store.user = { id: 'user-test' };
  vi.clearAllMocks();
});

describe('useEmailCampaigns - data layer', () => {
  it('lista vazia inicial', async () => {
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.avgOpenRate).toBe(0);
  });

  it('cria campanha com dados válidos', async () => {
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.create.mutateAsync({ name: 'C1', subject: 'S1', content_text: 'oi' } as any);
    });
    expect(store.campaigns).toHaveLength(1);
    expect(store.campaigns[0].user_id).toBe('user-test');
  });

  it('falha criação quando não autenticado', async () => {
    store.user = null;
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(
      result.current.create.mutateAsync({ name: 'X', subject: 'Y' } as any)
    ).rejects.toThrow('Não autenticado');
  });

  it('atualiza campanha (mutação update)', async () => {
    store.campaigns.push({ id: 'c1', user_id: 'user-test', name: 'A', subject: 'B', status: 'draft', total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 });
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));
    await act(async () => {
      await result.current.update.mutateAsync({ id: 'c1', subject: 'NOVO' });
    });
    expect(store.campaigns[0].subject).toBe('NOVO');
  });

  it('remove campanha', async () => {
    store.campaigns.push({ id: 'c1', user_id: 'user-test', name: 'A', subject: 'B', status: 'draft', total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 });
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));
    await act(async () => {
      await result.current.remove.mutateAsync('c1');
    });
    expect(store.campaigns).toHaveLength(0);
  });
});

describe('useEmailCampaigns - sendCampaign (materialização)', () => {
  beforeEach(() => {
    store.campaigns.push({
      id: 'cmp-1', user_id: 'user-test', name: 'X', subject: 'Y', status: 'draft',
      total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0,
    });
  });

  it('rejeita quando nenhum contato com email válido', async () => {
    store.contacts = [];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));
    await expect(result.current.sendCampaign.mutateAsync('cmp-1')).rejects.toThrow(/Nenhum contato/);
  });

  it('filtra emails inválidos (sem @)', async () => {
    store.contacts = [
      { id: 'k1', email: 'valido@x.com', first_name: 'A', last_name: 'B' },
      { id: 'k2', email: 'invalido', first_name: 'C', last_name: 'D' },
      { id: 'k3', email: null, first_name: 'E', last_name: 'F' },
    ];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));
    const r = await result.current.sendCampaign.mutateAsync('cmp-1');
    expect(r.recipientsCount).toBe(1);
    expect(store.recipients).toHaveLength(1);
    expect(store.recipients[0].email).toBe('valido@x.com');
  });

  it('é idempotente: re-envio não duplica destinatários existentes', async () => {
    store.contacts = [
      { id: 'k1', email: 'a@a.com', first_name: 'A', last_name: 'A' },
      { id: 'k2', email: 'b@b.com', first_name: 'B', last_name: 'B' },
    ];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));

    const first = await result.current.sendCampaign.mutateAsync('cmp-1');
    expect(first.newlyAdded).toBe(2);

    // Re-envio
    const second = await result.current.sendCampaign.mutateAsync('cmp-1');
    expect(second.newlyAdded).toBe(0);
    expect(second.recipientsCount).toBe(2);
    expect(store.recipients).toHaveLength(2); // Sem duplicatas
  });

  it('marca campanha como sent e atualiza total_recipients', async () => {
    store.contacts = [{ id: 'k1', email: 'x@y.com', first_name: 'X', last_name: 'Y' }];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));
    await result.current.sendCampaign.mutateAsync('cmp-1');
    expect(store.campaigns[0].status).toBe('sent');
    expect(store.campaigns[0].total_recipients).toBe(1);
    expect(store.campaigns[0].sent_at).toBeTruthy();
  });

  it('inserções marcam status=sent + sent_at preenchido', async () => {
    store.contacts = [{ id: 'k1', email: 'x@y.com', first_name: 'X', last_name: 'Y' }];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));
    await result.current.sendCampaign.mutateAsync('cmp-1');
    expect(store.recipients[0].status).toBe('sent');
    expect(store.recipients[0].sent_at).toBeTruthy();
    expect(store.recipients[0].campaign_id).toBe('cmp-1');
  });
});

describe('useEmailCampaigns - stats', () => {
  it('calcula taxas de abertura corretamente (média ponderada de campanhas com destinatários)', async () => {
    store.campaigns = [
      { id: '1', user_id: 'user-test', name: 'A', subject: 'A', status: 'sent', total_recipients: 100, total_opened: 50, total_clicked: 10, total_bounced: 0 }, // 50%
      { id: '2', user_id: 'user-test', name: 'B', subject: 'B', status: 'sent', total_recipients: 200, total_opened: 50, total_clicked: 5, total_bounced: 0 },  // 25%
      { id: '3', user_id: 'user-test', name: 'C', subject: 'C', status: 'draft', total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 },    // ignorado
    ];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(3));
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.sent).toBe(2);
    expect(result.current.stats.drafts).toBe(1);
    expect(result.current.stats.totalRecipients).toBe(300);
    expect(result.current.stats.totalOpened).toBe(100);
    expect(result.current.stats.avgOpenRate).toBe(38); // (50+25)/2 = 37.5 -> 38
  });

  it('avgOpenRate=0 quando nenhuma campanha tem destinatários', async () => {
    store.campaigns = [
      { id: '1', user_id: 'user-test', name: 'A', subject: 'A', status: 'draft', total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 },
    ];
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.campaigns.length).toBe(1));
    expect(result.current.stats.avgOpenRate).toBe(0);
  });
});
