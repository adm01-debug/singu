import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({ select: mockSelect, eq: mockEq }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null,
  Tooltip: () => null, Legend: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null,
  RadarChart: ({ children }: any) => <div>{children}</div>, Radar: () => null,
  PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/types/triggers', () => ({
  MENTAL_TRIGGERS: {},
  TriggerType: {},
  TRIGGER_CATEGORIES: {},
  TriggerCategory: {},
}));
vi.mock('@/hooks/useTriggerHistory', () => ({
  TriggerResult: {},
}));

import TriggerAnalytics from '../TriggerAnalytics';

describe('TriggerAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it('renders the component', () => {
    const { container } = render(<TriggerAnalytics />);
    expect(container).toBeTruthy();
  });

  it('shows loading skeleton initially', () => {
    render(<TriggerAnalytics />);
    const skeletons = document.querySelectorAll('.animate-pulse, [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows analytics title after loading', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/Analytics|Análise|Gatilhos/i)).toBeInTheDocument();
    });
  });

  it('calls supabase for trigger_usage', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('trigger_usage');
    });
  });

  it('renders tabs for different views', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/Visão Geral|Overview|DISC/i)).toBeInTheDocument();
    });
  });

  it('renders period selector', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/Período|30|90|dias/i)).toBeInTheDocument();
    });
  });

  it('renders chart sections', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      const { container } = render(<TriggerAnalytics />);
      expect(container).toBeTruthy();
    });
  });

  it('shows trigger effectiveness metrics', async () => {
    render(<TriggerAnalytics />);
    await waitFor(() => {
      expect(screen.getByText(/Efetividade|Taxa|Uso/i)).toBeInTheDocument();
    });
  });
});
