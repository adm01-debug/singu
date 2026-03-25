import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
        gte: vi.fn().mockReturnValue({
          data: [],
          count: 0,
          error: null,
        }),
      }),
    })),
  },
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
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));
vi.mock('@/components/ui/optimized-avatar', () => ({
  OptimizedAvatar: ({ alt }: any) => <div data-testid="avatar">{alt}</div>,
}));
vi.mock('@/components/ui/disc-badge', () => ({
  DISCBadge: ({ profile }: any) => <span data-testid="disc-badge">{profile}</span>,
}));
vi.mock('@/lib/contact-utils', () => ({
  getContactBehavior: () => null,
}));
vi.mock('@/data/discAdvancedData', () => ({
  DISC_PROFILES: {
    D: { name: 'Dominância', salesApproach: { presentation: ['tip1', 'tip2'] } },
    I: { name: 'Influência', salesApproach: { presentation: ['tip1', 'tip2'] } },
    S: { name: 'Estabilidade', salesApproach: { presentation: ['tip1', 'tip2'] } },
    C: { name: 'Conformidade', salesApproach: { presentation: ['tip1', 'tip2'] } },
  },
  DISC_BLEND_PROFILES: {},
  getProfileInfo: vi.fn(),
}));

vi.mock('@/hooks/useDISCAnalysis', () => ({
  useDISCAnalysis: () => ({
    dashboardData: {
      compatibilityInsights: {
        bestPerforming: 'I',
        needsImprovement: 'C',
      },
    },
    fetchDashboardData: vi.fn().mockResolvedValue(undefined),
  }),
}));

import DISCAnalyticsPanel from '../DISCAnalyticsPanel';

describe('DISCAnalyticsPanel', () => {
  it('renders loading state initially', () => {
    const { container } = render(<DISCAnalyticsPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the heading after loading', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('DISC Analytics')).toBeInTheDocument();
  });

  it('renders description text', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('Análise comportamental do portfólio de contatos')).toBeInTheDocument();
  });

  it('shows refresh button', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('Atualizar')).toBeInTheDocument();
  });

  it('shows stats cards after loading', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('Contatos perfilados')).toBeInTheDocument();
    expect(await screen.findByText('Confiança média')).toBeInTheDocument();
    expect(await screen.findByText('Perfil predominante')).toBeInTheDocument();
    expect(await screen.findByText('Análises recentes')).toBeInTheDocument();
  });

  it('renders tab navigation', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('Distribuição')).toBeInTheDocument();
    expect(await screen.findByText('Performance')).toBeInTheDocument();
    expect(await screen.findByText('Insights')).toBeInTheDocument();
    expect(await screen.findByText('Contatos')).toBeInTheDocument();
  });

  it('shows 0 for totalProfiled when no contacts', async () => {
    render(<DISCAnalyticsPanel />);
    const zeros = await screen.findAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('shows distribution chart section title', async () => {
    render(<DISCAnalyticsPanel />);
    expect(await screen.findByText('Distribuição por Perfil')).toBeInTheDocument();
  });

  it('renders pie chart', async () => {
    render(<DISCAnalyticsPanel />);
    const pieChart = await screen.findByTestId('pie-chart');
    expect(pieChart).toBeInTheDocument();
  });

  it('renders bar chart', async () => {
    render(<DISCAnalyticsPanel />);
    const barChart = await screen.findByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();
  });
});
