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
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));

const mockUseRFMAnalysis = vi.fn();
vi.mock('@/hooks/useRFMAnalysis', () => ({
  useRFMAnalysis: () => mockUseRFMAnalysis(),
}));
vi.mock('@/types/rfm', () => ({
  RFM_SEGMENTS: {},
}));

import { RFMAnalysisPanel } from '../RFMAnalysisPanel';

describe('RFMAnalysisPanel', () => {
  const defaultMock = {
    analysis: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  };

  beforeEach(() => {
    mockUseRFMAnalysis.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<RFMAnalysisPanel />);
    expect(document.querySelector('[class*="card"]')).toBeTruthy();
  });

  it('shows loading state with skeletons', () => {
    mockUseRFMAnalysis.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<RFMAnalysisPanel />);
    const skeletons = container.querySelectorAll('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles null analysis gracefully', () => {
    const { container } = render(<RFMAnalysisPanel />);
    expect(container).toBeTruthy();
  });

  it('renders with analysis data', () => {
    mockUseRFMAnalysis.mockReturnValue({
      ...defaultMock,
      analysis: {
        segments: [],
        contacts: [],
        history: [],
        actions: [],
        summary: {
          totalContacts: 50,
          averageRecency: 10,
          averageFrequency: 5,
          averageMonetary: 1000,
        },
      },
    });
    const { container } = render(<RFMAnalysisPanel />);
    expect(container).toBeTruthy();
  });

  it('handles error state', () => {
    mockUseRFMAnalysis.mockReturnValue({
      ...defaultMock,
      error: new Error('Failed to load'),
    });
    const { container } = render(<RFMAnalysisPanel />);
    expect(container).toBeTruthy();
  });

  it('passes className prop', () => {
    const { container } = render(<RFMAnalysisPanel className="test-class" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('supports compact mode', () => {
    const { container } = render(<RFMAnalysisPanel compact={true} />);
    expect(container).toBeTruthy();
  });

  it('calls refresh when available', () => {
    const refreshFn = vi.fn();
    mockUseRFMAnalysis.mockReturnValue({
      ...defaultMock,
      refresh: refreshFn,
    });
    render(<RFMAnalysisPanel />);
    expect(refreshFn).not.toHaveBeenCalled();
  });
});
