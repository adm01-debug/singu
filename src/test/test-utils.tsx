/**
 * Shared test utilities to reduce boilerplate across test files.
 * Import these helpers instead of duplicating mock setup.
 */
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { vi } from 'vitest';

// ===== Common Mocks =====

/** Creates a standard Supabase mock with chainable query builder */
export function createSupabaseMock() {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb: (value: { data: null; error: null }) => void) =>
      Promise.resolve(cb({ data: null, error: null }))),
  };

  return {
    from: vi.fn(() => queryBuilder),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    _queryBuilder: queryBuilder,
  };
}

/** Creates a standard useAuth mock return value */
export function createAuthMock(overrides?: Partial<{
  user: { id: string; email: string } | null;
  session: { access_token: string } | null;
  loading: boolean;
}>) {
  return {
    user: overrides?.user ?? { id: 'test-user-id', email: 'test@test.com' },
    session: overrides?.session ?? { access_token: 'test-token' },
    loading: overrides?.loading ?? false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
  };
}

/** Creates a standard useToast mock */
export function createToastMock() {
  const toast = vi.fn();
  return { toast, dismiss: vi.fn(), toasts: [] };
}

/** Creates a standard React Router mock */
export function createRouterMock(pathname = '/') {
  return {
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname, search: '', hash: '', state: null })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  };
}

// ===== Mock Contact Data =====
export const mockContact = {
  id: 'contact-1',
  first_name: 'João',
  last_name: 'Silva',
  email: 'joao@test.com',
  phone: '(11) 99999-9999',
  role: 'decision_maker',
  role_title: 'CEO',
  company_id: 'company-1',
  user_id: 'test-user-id',
  relationship_score: 85,
  relationship_stage: 'active',
  sentiment: 'positive',
  tags: ['vip', 'tech'],
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

export const mockCompany = {
  id: 'company-1',
  name: 'Tech Corp',
  industry: 'Tecnologia',
  website: 'https://techcorp.com',
  phone: '(11) 3333-3333',
  email: 'contato@techcorp.com',
  address: 'Av. Paulista, 1000',
  notes: 'Empresa de tecnologia',
  user_id: 'test-user-id',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

export const mockInteraction = {
  id: 'interaction-1',
  contact_id: 'contact-1',
  company_id: 'company-1',
  user_id: 'test-user-id',
  type: 'meeting',
  content: 'Reunião sobre o projeto',
  transcription: null,
  sentiment: 'positive',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

// ===== Custom Render with Providers =====

function TestProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// ===== Wait Helpers =====
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const flushPromises = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
