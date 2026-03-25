import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/hooks/useTemplateNotifications', () => ({
  useTemplateNotifications: () => ({
    settings: {
      enabled: false,
      minSuccessRate: 70,
      minUsageCount: 3,
      notifyProfiles: ['D', 'I', 'S', 'C'],
      cooldownMinutes: 60,
    },
    loading: false,
    updateSettings: vi.fn(),
    checkForHighPerformers: vi.fn(),
  }),
  TemplateNotificationSettings: {},
}));
vi.mock('@/lib/pushNotifications', () => ({
  subscribeToPush: vi.fn(),
  isPushSupported: vi.fn(() => false),
  getSubscriptionStatus: vi.fn().mockResolvedValue({ isSubscribed: false }),
}));

import { TemplateNotificationSettings } from '../TemplateNotificationSettings';

describe('TemplateNotificationSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<TemplateNotificationSettings />);
    expect(container).toBeTruthy();
  });

  it('shows notification settings title', () => {
    render(<TemplateNotificationSettings />);
    expect(screen.getByText(/Notificações|Notificação|Template/i)).toBeInTheDocument();
  });

  it('shows DISC profile checkboxes', () => {
    render(<TemplateNotificationSettings />);
    expect(screen.getByText('Dominante')).toBeInTheDocument();
    expect(screen.getByText('Influente')).toBeInTheDocument();
    expect(screen.getByText('Estável')).toBeInTheDocument();
    expect(screen.getByText('Conforme')).toBeInTheDocument();
  });

  it('renders enable/disable switch', () => {
    render(<TemplateNotificationSettings />);
    const switches = document.querySelectorAll('[role="switch"]');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts className prop', () => {
    const { container } = render(<TemplateNotificationSettings className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('shows min success rate setting', () => {
    render(<TemplateNotificationSettings />);
    expect(screen.getByText(/Taxa|Sucesso|70/i)).toBeInTheDocument();
  });

  it('shows cooldown setting', () => {
    render(<TemplateNotificationSettings />);
    expect(screen.getByText(/Cooldown|Intervalo|60/i)).toBeInTheDocument();
  });

  it('renders check button', () => {
    render(<TemplateNotificationSettings />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
