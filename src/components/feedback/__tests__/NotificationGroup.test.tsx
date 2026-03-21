import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationGroup, GroupedNotifications, type NotificationItem } from '../NotificationGroup';
import { Bell, AlertTriangle } from 'lucide-react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockNotifications: NotificationItem[] = [
  { id: '1', type: 'alert', title: 'Alert 1', description: 'Description 1', createdAt: new Date(), read: false, priority: 'high' },
  { id: '2', type: 'alert', title: 'Alert 2', description: 'Description 2', createdAt: new Date(), read: true },
  { id: '3', type: 'alert', title: 'Alert 3', createdAt: new Date(), read: false },
  { id: '4', type: 'alert', title: 'Alert 4', createdAt: new Date(), read: false },
];

describe('NotificationGroup', () => {
  const mockOnDismiss = vi.fn();
  const mockOnDismissAll = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when there are no notifications', () => {
    const { container } = render(
      <NotificationGroup
        type="alert"
        label="Alerts"
        icon={Bell}
        notifications={[]}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders group label and count', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('(4 itens)')).toBeInTheDocument();
  });

  it('renders unread count badge', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('3 novos')).toBeInTheDocument();
  });

  it('renders Limpar todos button', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('Limpar todos')).toBeInTheDocument();
  });

  it('calls onDismissAll when clear all is clicked', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    fireEvent.click(screen.getByText('Limpar todos'));
    expect(mockOnDismissAll).toHaveBeenCalledTimes(1);
  });

  it('shows only maxVisible notifications by default', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
        maxVisible={2}
      />
    );
    expect(screen.getByText('Alert 1')).toBeInTheDocument();
    expect(screen.getByText('Alert 2')).toBeInTheDocument();
    expect(screen.queryByText('Alert 3')).not.toBeInTheDocument();
  });

  it('renders "Ver mais" button when there are hidden notifications', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
        maxVisible={2}
      />
    );
    expect(screen.getByText(/Ver mais 2 notificações/)).toBeInTheDocument();
  });

  it('expands to show all notifications when Ver mais is clicked', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
        maxVisible={2}
      />
    );
    fireEvent.click(screen.getByText(/Ver mais/));
    expect(screen.getByText('Alert 3')).toBeInTheDocument();
    expect(screen.getByText('Alert 4')).toBeInTheDocument();
  });

  it('renders priority badge for high priority notifications', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('renders notification descriptions', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={mockNotifications}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('uses singular form for single item count', () => {
    render(
      <NotificationGroup
        type="alert"
        label="Alertas"
        icon={Bell}
        notifications={[mockNotifications[0]]}
        onDismiss={mockOnDismiss}
        onDismissAll={mockOnDismissAll}
      />
    );
    expect(screen.getByText('(1 item)')).toBeInTheDocument();
  });
});

describe('GroupedNotifications', () => {
  it('renders empty state when no notifications', () => {
    render(
      <GroupedNotifications
        notifications={[]}
        onDismiss={vi.fn()}
        onDismissAll={vi.fn()}
        groupConfig={{}}
      />
    );
    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
    expect(screen.getByText('Você está em dia!')).toBeInTheDocument();
  });

  it('groups notifications by type', () => {
    const notifications: NotificationItem[] = [
      { id: '1', type: 'alert', title: 'Alert 1', createdAt: new Date(), read: false },
      { id: '2', type: 'info', title: 'Info 1', createdAt: new Date(), read: false },
    ];
    render(
      <GroupedNotifications
        notifications={notifications}
        onDismiss={vi.fn()}
        onDismissAll={vi.fn()}
        groupConfig={{
          alert: { label: 'Alertas', icon: AlertTriangle },
          info: { label: 'Info', icon: Bell },
        }}
      />
    );
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
