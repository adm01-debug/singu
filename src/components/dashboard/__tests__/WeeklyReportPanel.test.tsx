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

const mockUseWeeklyReport = vi.fn();
vi.mock('@/hooks/useWeeklyReport', () => ({
  useWeeklyReport: () => mockUseWeeklyReport(),
}));

import { WeeklyReportPanel } from '../WeeklyReportPanel';

describe('WeeklyReportPanel', () => {
  const defaultMock = {
    settings: {
      enabled: true,
      send_day: 'monday',
      send_time: '09:00',
      email_address: '',
      include_portfolio_summary: true,
      include_at_risk_clients: true,
      include_health_alerts: true,
    },
    reports: [],
    loading: false,
    generating: false,
    saveSettings: vi.fn(),
    generateReport: vi.fn(),
    sendTestEmail: vi.fn(),
    dayOptions: [
      { value: 'monday', label: 'Segunda' },
      { value: 'tuesday', label: 'Terça' },
    ],
  };

  beforeEach(() => {
    mockUseWeeklyReport.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    const { container } = render(<WeeklyReportPanel />);
    expect(container).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseWeeklyReport.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<WeeklyReportPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles empty reports list', () => {
    const { container } = render(<WeeklyReportPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders tab navigation', () => {
    render(<WeeklyReportPanel />);
    const tabs = document.querySelectorAll('[role="tab"], button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<WeeklyReportPanel />);
    expect(() => rerender(<WeeklyReportPanel />)).not.toThrow();
  });

  it('handles null settings', () => {
    mockUseWeeklyReport.mockReturnValue({ ...defaultMock, settings: null });
    const { container } = render(<WeeklyReportPanel />);
    expect(container).toBeTruthy();
  });

  it('renders with reports data', () => {
    mockUseWeeklyReport.mockReturnValue({
      ...defaultMock,
      reports: [
        {
          id: 'r1',
          createdAt: new Date().toISOString(),
          status: 'sent',
          summary: 'Weekly summary',
        },
      ],
    });
    const { container } = render(<WeeklyReportPanel />);
    expect(container).toBeTruthy();
  });

  it('renders the component container', () => {
    const { container } = render(<WeeklyReportPanel />);
    expect(container.firstChild).toBeTruthy();
  });
});
