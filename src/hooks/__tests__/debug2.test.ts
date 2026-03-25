import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

const { mockToast, mockQueryExternalData, mockSupabaseFrom } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockQueryExternalData: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

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
  user_id: 'test-user-123', created_at: '2025-01-01', updated_at: '2025-01-01',
};

describe('debug create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryExternalData.mockImplementation(() => Promise.resolve({ data: [], count: 0, error: null }));
    
    // Set up supabase chain that actually works
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeContact, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(chain);
  });

  afterEach(() => { cleanup(); });

  it('should create a contact', async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    console.log('About to create...');
    await act(async () => {
      const c = await result.current.createContact({ first_name: 'John', last_name: 'Doe' } as any);
      console.log('Created:', c);
      expect(c).toBeTruthy();
    });
  });
});
