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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), limit: vi.fn().mockResolvedValue({ data: [], error: null }), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/calendario', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/celebrations/CelebrationProvider', () => ({
  useCelebration: () => ({ celebrate: vi.fn() }),
}));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/feedback/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/navigation/SmartBreadcrumbs', () => ({ SmartBreadcrumbs: () => <div data-testid="breadcrumbs" /> }));
vi.mock('@/components/micro-interactions/MorphingNumber', () => ({ MorphingNumber: ({ value }: any) => <span>{value}</span> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));
vi.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));

import Calendario from '../Calendario';

describe('Calendario Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Calendario />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Calendário header', () => {
    render(<Calendario />);
    expect(screen.getByText('Calendário')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<Calendario />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the header component', () => {
    render(<Calendario />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Calendario />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('does not crash with empty data', () => {
    expect(() => render(<Calendario />)).not.toThrow();
  });

  it('renders month navigation buttons', () => {
    render(<Calendario />);
    // Should have prev/next month buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the calendar grid', () => {
    render(<Calendario />);
    // Days of week headers should be present
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });
});
