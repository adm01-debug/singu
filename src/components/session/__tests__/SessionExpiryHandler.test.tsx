import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionExpiryHandler } from '../SessionExpiryHandler';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } }, signOut: vi.fn() }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
    },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })),
  },
}));

describe('SessionExpiryHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: session not expiring soon
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } },
      error: null,
    });
  });

  it('renders children content', () => {
    render(
      <SessionExpiryHandler>
        <div>App Content</div>
      </SessionExpiryHandler>
    );
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('does not show warning when session is valid', () => {
    render(
      <SessionExpiryHandler>
        <div>Content</div>
      </SessionExpiryHandler>
    );
    expect(screen.queryByText('Sessão Expirando')).not.toBeInTheDocument();
    expect(screen.queryByText('Sessão Expirada')).not.toBeInTheDocument();
  });

  it('renders children without dialog wrapper by default', () => {
    render(
      <SessionExpiryHandler>
        <div data-testid="child">Child</div>
      </SessionExpiryHandler>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('accepts warningMinutes prop', () => {
    render(
      <SessionExpiryHandler warningMinutes={10}>
        <div>Content</div>
      </SessionExpiryHandler>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts autoRefresh prop', () => {
    render(
      <SessionExpiryHandler autoRefresh={false}>
        <div>Content</div>
      </SessionExpiryHandler>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders without children', () => {
    const { container } = render(<SessionExpiryHandler />);
    expect(container).toBeInTheDocument();
  });

  it('subscribes to auth state changes', () => {
    render(
      <SessionExpiryHandler>
        <div>Content</div>
      </SessionExpiryHandler>
    );
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('checks session on mount', async () => {
    render(
      <SessionExpiryHandler>
        <div>Content</div>
      </SessionExpiryHandler>
    );
    // Wait for the async effect
    await vi.waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });
  });
});
