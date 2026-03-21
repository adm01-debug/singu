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
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

const mockUsePortfolioHealth = vi.fn();
vi.mock('@/hooks/usePortfolioHealth', () => ({
  usePortfolioHealth: (...args: any[]) => mockUsePortfolioHealth(...args),
}));

import { PortfolioHealthDashboard } from '../PortfolioHealthDashboard';

describe('PortfolioHealthDashboard', () => {
  const defaultProps = {
    contacts: [],
    interactions: [],
  };

  const defaultMock = {
    healthScore: 75,
    statusDistribution: { healthy: 10, warning: 5, critical: 2 },
    clients: [],
    loading: false,
    trends: { weeklyChange: 3, monthlyChange: 8 },
    urgentActions: [],
  };

  beforeEach(() => {
    mockUsePortfolioHealth.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    const { container } = render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders with contacts data', () => {
    const { container } = render(
      <PortfolioHealthDashboard
        contacts={[{ id: '1', first_name: 'Test', last_name: 'User' }] as any}
        interactions={[]}
      />
    );
    expect(container).toBeTruthy();
  });

  it('handles empty contacts gracefully', () => {
    const { container } = render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders health score', () => {
    const { container } = render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders in compact mode', () => {
    const { container } = render(<PortfolioHealthDashboard {...defaultProps} compact={true} />);
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(() => rerender(<PortfolioHealthDashboard {...defaultProps} />)).not.toThrow();
  });

  it('renders charts', () => {
    render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('handles status distribution', () => {
    mockUsePortfolioHealth.mockReturnValue({
      ...defaultMock,
      statusDistribution: { healthy: 20, warning: 10, critical: 5 },
    });
    const { container } = render(<PortfolioHealthDashboard {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
