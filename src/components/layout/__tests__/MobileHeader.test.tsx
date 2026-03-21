import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileHeader } from '../MobileHeader';

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
vi.mock('./MobileSidebarDrawer', () => ({
  MobileSidebarDrawer: ({ open }: any) => open ? <div data-testid="mobile-drawer">Drawer</div> : null,
}));

describe('MobileHeader', () => {
  it('renders the SINGU brand when no title is provided', () => {
    render(<MobileHeader />);
    expect(screen.getByText('SINGU')).toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    render(<MobileHeader title="Contatos" />);
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('does not render SINGU when title is provided', () => {
    render(<MobileHeader title="Contatos" />);
    expect(screen.queryByText('SINGU')).not.toBeInTheDocument();
  });

  it('renders header element', () => {
    const { container } = render(<MobileHeader />);
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('opens drawer when menu button is clicked', () => {
    render(<MobileHeader />);
    // The menu button is the first button (hamburger icon)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
  });

  it('calls onSearchClick when search button is clicked', () => {
    const onSearch = vi.fn();
    render(<MobileHeader onSearchClick={onSearch} />);
    // Search is the second button
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('renders notification bell icon', () => {
    render(<MobileHeader />);
    // There should be 3 buttons: menu, search, bell
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders notification indicator dot', () => {
    const { container } = render(<MobileHeader />);
    const dot = container.querySelector('.bg-destructive');
    expect(dot).toBeInTheDocument();
  });
});
