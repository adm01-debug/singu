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
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: () => null,
}));

import { ActivityChart, RelationshipEvolutionChart, ContactDistributionChart, RelationshipScoreChart, SentimentChart } from '../DashboardCharts';

describe('DashboardCharts', () => {
  describe('ActivityChart', () => {
    it('renders without crashing', () => {
      const { container } = render(<ActivityChart period="7d" />);
      expect(container).toBeTruthy();
    });

    it('renders with 7d period', () => {
      const { container } = render(<ActivityChart period="7d" />);
      expect(container.innerHTML).not.toBe('');
    });

    it('renders with 30d period', () => {
      const { container } = render(<ActivityChart period="30d" />);
      expect(container).toBeTruthy();
    });

    it('renders with 90d period', () => {
      const { container } = render(<ActivityChart period="90d" />);
      expect(container).toBeTruthy();
    });

    it('does not crash on re-render with different period', () => {
      const { rerender } = render(<ActivityChart period="7d" />);
      expect(() => rerender(<ActivityChart period="30d" />)).not.toThrow();
    });
  });

  describe('ContactDistributionChart', () => {
    it('renders without crashing', () => {
      const { container } = render(<ContactDistributionChart />);
      expect(container).toBeTruthy();
    });

    it('renders pie chart', () => {
      render(<ContactDistributionChart />);
      const chart = document.querySelector('[data-testid="pie-chart"]');
      expect(chart).toBeTruthy();
    });
  });

  describe('RelationshipEvolutionChart', () => {
    it('renders without crashing', () => {
      const { container } = render(<RelationshipEvolutionChart period="7d" />);
      expect(container).toBeTruthy();
    });
  });

  describe('RelationshipScoreChart', () => {
    it('renders without crashing', () => {
      const { container } = render(<RelationshipScoreChart period="7d" />);
      expect(container).toBeTruthy();
    });
  });

  describe('SentimentChart', () => {
    it('renders without crashing', () => {
      const { container } = render(<SentimentChart period="7d" />);
      expect(container).toBeTruthy();
    });
  });
});
