import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCampaignRecipients } from '../useCampaignRecipients';

const orderMock = vi.fn();
const limitMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: orderMock,
        })),
      })),
    })),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useCampaignRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue({ data: [], error: null });
    orderMock.mockReturnValue({ limit: limitMock });
  });

  it('does not fetch when campaignId is undefined', async () => {
    const { result } = renderHook(() => useCampaignRecipients(undefined), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });

  it('fetches recipients when campaignId is provided', async () => {
    const fakeRows = [
      { id: 'r1', campaign_id: 'c1', contact_id: 'ct1', email: 'a@b.com', status: 'sent', sent_at: null, opened_at: null, clicked_at: null, created_at: '2025-01-01' },
    ];
    limitMock.mockResolvedValue({ data: fakeRows, error: null });

    const { result } = renderHook(() => useCampaignRecipients('c1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeRows);
  });

  it('throws when supabase returns error', async () => {
    limitMock.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useCampaignRecipients('c1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('returns empty array when data is null', async () => {
    limitMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useCampaignRecipients('c1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
