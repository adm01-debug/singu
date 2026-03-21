import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileBottomNav } from '../MobileBottomNav';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } } }), AuthProvider: ({ children }: any) => children }));
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
vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ selection: vi.fn(), light: vi.fn(), medium: vi.fn(), heavy: vi.fn() }),
}));

describe('MobileBottomNav', () => {
  it('renders the bottom navigation bar', () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders main navigation items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Interações')).toBeInTheDocument();
  });

  it('renders Mais button', () => {
    render(<MobileBottomNav />);
    expect(screen.getByText('Mais')).toBeInTheDocument();
  });

  it('renders aria labels for main nav items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByLabelText('Início')).toBeInTheDocument();
    expect(screen.getByLabelText('Contatos')).toBeInTheDocument();
    expect(screen.getByLabelText('Empresas')).toBeInTheDocument();
    expect(screen.getByLabelText('Interações')).toBeInTheDocument();
  });

  it('has navigation landmark with aria-label', () => {
    render(<MobileBottomNav />);
    expect(screen.getByLabelText('Menu principal')).toBeInTheDocument();
  });

  it('shows more menu when Mais is clicked', () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText('Mais'));
    expect(screen.getByText('Mais opções')).toBeInTheDocument();
  });

  it('shows additional nav items in more menu', () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText('Mais'));
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders close button in more menu with aria-label', () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText('Mais'));
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();
  });

  it('closes more menu when close button is clicked', () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText('Mais'));
    expect(screen.getByText('Mais opções')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Fechar menu'));
    expect(screen.queryByText('Mais opções')).not.toBeInTheDocument();
  });

  it('marks current page with aria-current', () => {
    render(<MobileBottomNav />);
    const homeButton = screen.getByLabelText('Início');
    expect(homeButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders Network in more menu', () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByText('Mais'));
    expect(screen.getByText('Network')).toBeInTheDocument();
  });
});
