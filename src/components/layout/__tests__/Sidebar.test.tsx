import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from '../Sidebar';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', last_name: 'User' } }, signOut: vi.fn() }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));
vi.mock('@/hooks/useSidebarState', () => ({
  useSidebarState: () => ({ collapsed: false, toggle: vi.fn() }),
}));
vi.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({}),
}));
vi.mock('@/hooks/useNotificationCounts', () => ({
  useNotificationCounts: () => ({ counts: { interactions: 0, insights: 0, total: 3 } }),
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  isMacOS: () => false,
}));
vi.mock('@/components/ui/optimized-avatar', () => ({
  OptimizedAvatar: ({ fallback }: any) => <span data-testid="avatar">{fallback}</span>,
}));
vi.mock('@/components/navigation/RecentFavoritesMenu', () => ({
  RecentFavoritesMenu: () => null,
}));

describe('Sidebar', () => {
  it('renders the SINGU brand name', () => {
    render(<Sidebar />);
    expect(screen.getByText('SINGU')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Sidebar />);
    expect(screen.getByText('Inteligência Relacional')).toBeInTheDocument();
  });

  it('renders main navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders bottom navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders navigation links with correct paths', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Empresas').closest('a')).toHaveAttribute('href', '/empresas');
    expect(screen.getByText('Contatos').closest('a')).toHaveAttribute('href', '/contatos');
  });

  it('renders search button with Buscar text', () => {
    render(<Sidebar />);
    expect(screen.getByText('Buscar...')).toBeInTheDocument();
  });

  it('renders collapse/expand button with aria-label', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Colapsar sidebar')).toBeInTheDocument();
  });

  it('renders user name from auth', () => {
    render(<Sidebar />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders user email', () => {
    render(<Sidebar />);
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('renders user avatar with initials', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('TU');
  });

  it('renders keyboard shortcut indicator for search', () => {
    render(<Sidebar />);
    expect(screen.getByText('CtrlK')).toBeInTheDocument();
  });

  it('renders network navigation item', () => {
    render(<Sidebar />);
    expect(screen.getByText('Network')).toBeInTheDocument();
  });
});
