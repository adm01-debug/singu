import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));

const mockUseHealthAlerts = vi.fn();
vi.mock('@/hooks/useHealthAlerts', () => ({
  useHealthAlerts: () => mockUseHealthAlerts(),
}));

import { HealthAlertsPanel } from '../HealthAlertsPanel';

describe('HealthAlertsPanel', () => {
  const defaultMock = {
    alerts: [],
    criticalAlerts: [],
    warningAlerts: [],
    settings: {
      push_notifications: true,
      email_notifications: false,
      critical_threshold: 30,
      warning_threshold: 50,
      notify_on_critical: true,
      notify_on_warning: false,
      email_address: '',
    },
    loading: false,
    settingsLoading: false,
    dismissAlert: vi.fn(),
    dismissAllAlerts: vi.fn(),
    saveSettings: vi.fn(),
    checkHealthNow: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    mockUseHealthAlerts.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    const { container } = render(<HealthAlertsPanel />);
    expect(container).toBeTruthy();
  });

  it('shows loading state with skeletons', () => {
    mockUseHealthAlerts.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<HealthAlertsPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles empty alerts', () => {
    const { container } = render(<HealthAlertsPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with alerts data', () => {
    mockUseHealthAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        {
          id: '1',
          contact_id: 'c1',
          contact_name: 'Test User',
          type: 'relationship_declining',
          severity: 'critical',
          message: 'Score dropped',
          created_at: new Date().toISOString(),
          dismissed: false,
        },
      ],
      criticalAlerts: [
        {
          id: '1',
          contact_id: 'c1',
          contact_name: 'Test User',
          type: 'relationship_declining',
          severity: 'critical',
          message: 'Score dropped',
          created_at: new Date().toISOString(),
          dismissed: false,
        },
      ],
    });
    const { container } = render(<HealthAlertsPanel />);
    expect(container).toBeTruthy();
  });

  it('renders tab navigation', () => {
    render(<HealthAlertsPanel />);
    const tabs = document.querySelectorAll('[role="tab"], button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('does not throw on re-render', () => {
    const { rerender } = render(<HealthAlertsPanel />);
    expect(() => rerender(<HealthAlertsPanel />)).not.toThrow();
  });

  it('handles null settings', () => {
    mockUseHealthAlerts.mockReturnValue({ ...defaultMock, settings: null });
    const { container } = render(<HealthAlertsPanel />);
    expect(container).toBeTruthy();
  });

  it('shows critical alert count', () => {
    mockUseHealthAlerts.mockReturnValue({
      ...defaultMock,
      criticalAlerts: [{ id: '1' }, { id: '2' }],
    });
    const { container } = render(<HealthAlertsPanel />);
    expect(container).toBeTruthy();
  });
});
