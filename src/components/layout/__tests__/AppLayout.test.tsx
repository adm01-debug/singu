import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppLayout } from '../AppLayout';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } }, signOut: vi.fn() }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('./Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));
vi.mock('./MobileHeader', () => ({
  MobileHeader: () => <header data-testid="mobile-header">MobileHeader</header>,
}));
vi.mock('./MobileBottomNav', () => ({
  MobileBottomNav: () => <nav data-testid="mobile-bottom-nav">MobileBottomNav</nav>,
}));
vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: () => null,
}));
vi.mock('@/components/quick-add/QuickAddButton', () => ({
  QuickAddButton: () => null,
}));
vi.mock('@/components/notifications/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));
vi.mock('@/components/onboarding/OnboardingTourWrapper', () => ({
  OnboardingTourWrapper: () => null,
}));
vi.mock('@/hooks/useGlobalSearch', () => ({
  useGlobalSearch: () => ({ isOpen: false, setIsOpen: vi.fn() }),
}));
vi.mock('@/hooks/useSidebarState', () => ({
  useSidebarState: () => ({ collapsed: false }),
}));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({
  useKeyboardShortcutsEnhanced: () => ({}),
}));
vi.mock('@/components/navigation/NavigationPatterns', () => ({
  SkipToContent: () => <a data-testid="skip-to-content" href="#main-content">Skip</a>,
}));

describe('AppLayout', () => {
  it('renders children content', () => {
    render(<AppLayout><div>Page Content</div></AppLayout>);
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders sidebar component', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders mobile header', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
  });

  it('renders mobile bottom navigation', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
  });

  it('renders main content area with id main-content', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders skip to content link for accessibility', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('skip-to-content')).toBeInTheDocument();
  });

  it('renders with background class', () => {
    const { container } = render(<AppLayout><div>Content</div></AppLayout>);
    expect(container.firstChild).toHaveClass('min-h-screen');
    expect(container.firstChild).toHaveClass('bg-background');
  });

  it('renders main element as child of layout div', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    const main = document.getElementById('main-content');
    expect(main?.tagName).toBe('MAIN');
  });
});
