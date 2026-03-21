import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileSidebarDrawer } from '../MobileSidebarDrawer';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', avatar_url: null } }, signOut: vi.fn().mockResolvedValue(undefined) }), AuthProvider: ({ children }: any) => children }));
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

describe('MobileSidebarDrawer', () => {
  const mockOnClose = vi.fn();

  it('renders nothing when closed', () => {
    const { container } = render(
      <MobileSidebarDrawer open={false} onClose={mockOnClose} />
    );
    expect(container.querySelector('aside')).not.toBeInTheDocument();
  });

  it('renders drawer when open', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('SINGU')).toBeInTheDocument();
  });

  it('renders all navigation items when open', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Interações')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders section labels', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Análise')).toBeInTheDocument();
    expect(screen.getByText('Ferramentas')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Buscar...')).toBeInTheDocument();
  });

  it('renders user email', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    // Find the X button (close)
    const buttons = screen.getAllByRole('button');
    // The first button with X icon should close
    const closeButton = buttons.find(b => b.querySelector('.lucide-x') || b.textContent === '');
    if (closeButton) fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders the backdrop overlay when open', () => {
    const { container } = render(
      <MobileSidebarDrawer open={true} onClose={mockOnClose} />
    );
    const backdrop = container.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders notification item', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Notificações')).toBeInTheDocument();
  });

  it('renders Network navigation item', () => {
    render(<MobileSidebarDrawer open={true} onClose={mockOnClose} />);
    expect(screen.getByText('Network')).toBeInTheDocument();
  });
});
