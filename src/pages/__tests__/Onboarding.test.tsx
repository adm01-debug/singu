import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', last_name: 'User' } }, session: { access_token: 'token' }, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }), Toaster: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/onboarding', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'shape') }) }));

vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  default: ({ onComplete }: any) => (
    <div data-testid="onboarding-wizard">
      <button data-testid="complete-btn" onClick={onComplete}>Complete</button>
    </div>
  ),
}));

import Onboarding from '../Onboarding';
import { fireEvent } from '@testing-library/react';

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Onboarding />);
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
  });

  it('renders the OnboardingWizard component', () => {
    render(<Onboarding />);
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
  });

  it('navigates to home on completion', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByTestId('complete-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows loading state when auth is loading', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any);

    render(<Onboarding />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('redirects to auth when no user', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any);

    render(<Onboarding />);
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('does not redirect when user is present', () => {
    render(<Onboarding />);
    expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
  });

  it('renders without any errors', () => {
    expect(() => render(<Onboarding />)).not.toThrow();
  });

  it('renders wizard when authenticated', () => {
    render(<Onboarding />);
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
