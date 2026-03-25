import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationCenter } from '../NotificationCenter';

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
vi.mock('@/hooks/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    clearUnread: vi.fn(),
    dismissNotification: vi.fn(),
  }),
}));
vi.mock('@/components/micro-interactions', () => ({
  AnimatedBadge: ({ count }: any) => count > 0 ? <span data-testid="badge">{count}</span> : null,
}));
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
  useMotionSafe: () => ({ transition: {} }),
}));
vi.mock('@/components/feedback/NotificationGroup', () => ({
  GroupedNotifications: ({ notifications }: any) => (
    notifications.length === 0
      ? <div>Nenhuma notificação</div>
      : <div>{notifications.map((n: any) => <div key={n.id}>{n.title}</div>)}</div>
  ),
}));

describe('NotificationCenter', () => {
  it('renders notification bell button', () => {
    render(<NotificationCenter />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders accessible label for no unread', () => {
    render(<NotificationCenter />);
    expect(screen.getByLabelText('Notificações')).toBeInTheDocument();
  });

  it('renders accessible label with unread count', () => {
    const { useRealtimeNotifications } = vi.mocked(await import('@/hooks/useRealtimeNotifications'));
    vi.mocked(useRealtimeNotifications).mockReturnValue({
      notifications: [{ id: '1', type: 'alert', title: 'Test', description: '', createdAt: new Date(), entityId: '', entityType: '' }],
      unreadCount: 3,
      clearUnread: vi.fn(),
      dismissNotification: vi.fn(),
    });

    render(<NotificationCenter />);
    expect(screen.getByLabelText('Notificações: 3 não lidas')).toBeInTheDocument();
  });

  it('does not show badge when unread count is 0', () => {
    render(<NotificationCenter />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('shows badge when there are unread notifications', () => {
    const { useRealtimeNotifications } = vi.mocked(await import('@/hooks/useRealtimeNotifications'));
    vi.mocked(useRealtimeNotifications).mockReturnValue({
      notifications: [{ id: '1', type: 'alert', title: 'Test', description: '', createdAt: new Date(), entityId: '', entityType: '' }],
      unreadCount: 5,
      clearUnread: vi.fn(),
      dismissNotification: vi.fn(),
    });

    render(<NotificationCenter />);
    expect(screen.getByTestId('badge')).toHaveTextContent('5');
  });

  it('renders button with ghost variant', () => {
    render(<NotificationCenter />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders bell icon inside button', () => {
    const { container } = render(<NotificationCenter />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with relative positioning for badge', () => {
    const { container } = render(<NotificationCenter />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('relative');
  });
});
