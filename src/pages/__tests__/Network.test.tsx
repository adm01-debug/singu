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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), limit: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/network', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('react-force-graph-2d', () => ({ default: (props: any) => <div data-testid="force-graph" /> }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/network/NetworkVisualization', () => ({ NetworkVisualization: () => <div data-testid="network-visualization" /> }));
vi.mock('@/components/feedback/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/navigation/SmartBreadcrumbs', () => ({ SmartBreadcrumbs: () => <div data-testid="breadcrumbs" /> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

import Network from '../Network';

describe('Network Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Network />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Network header', () => {
    render(<Network />);
    expect(screen.getByText('Network Visualization')).toBeInTheDocument();
  });

  it('shows the subtitle', () => {
    render(<Network />);
    expect(screen.getByText('Mapa interativo de relacionamentos, empresas e contatos')).toBeInTheDocument();
  });

  it('renders the network visualization component', () => {
    render(<Network />);
    expect(screen.getByTestId('network-visualization')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Network />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<Network />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the header component', () => {
    render(<Network />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('does not crash on render', () => {
    expect(() => render(<Network />)).not.toThrow();
  });
});
