import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

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
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/design-system', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/ui/typography', () => ({
  Typography: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
  Heading: ({ children, level }: any) => {
    const Tag = `h${level}` as any;
    return <Tag>{children}</Tag>;
  },
  DisplayText: ({ children }: any) => <h1 data-testid="display-text">{children}</h1>,
}));
vi.mock('@/components/ui/surface', () => ({
  Surface: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

import DesignSystem from '../DesignSystem';

describe('DesignSystem Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DesignSystem />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Design System title', () => {
    render(<DesignSystem />);
    expect(screen.getByText('SINGU Design System')).toBeInTheDocument();
  });

  it('shows Design Tokens display text', () => {
    render(<DesignSystem />);
    expect(screen.getByText('Design Tokens')).toBeInTheDocument();
  });

  it('shows typography section', () => {
    render(<DesignSystem />);
    expect(screen.getByText('Tipografia')).toBeInTheDocument();
  });

  it('shows colors section', () => {
    render(<DesignSystem />);
    expect(screen.getByText('Cores')).toBeInTheDocument();
  });

  it('displays color tokens', () => {
    render(<DesignSystem />);
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Destructive')).toBeInTheDocument();
  });

  it('shows typography variants', () => {
    render(<DesignSystem />);
    expect(screen.getByText('Display Text')).toBeInTheDocument();
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Heading 2')).toBeInTheDocument();
  });

  it('shows lead description text', () => {
    render(<DesignSystem />);
    expect(screen.getByText(/Referência visual completa/)).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<DesignSystem />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('does not crash on render', () => {
    expect(() => render(<DesignSystem />)).not.toThrow();
  });
});
