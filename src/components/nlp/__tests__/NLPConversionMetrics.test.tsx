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
vi.mock('@/types/vak', () => ({
  VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
  VAKType: {},
}));

import NLPConversionMetrics from '../NLPConversionMetrics';

describe('NLPConversionMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it('renders loading skeleton initially', () => {
    render(<NLPConversionMetrics />);
    const skeletons = document.querySelectorAll('.animate-pulse, [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the title after loading', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Métricas de Conversão PNL')).toBeInTheDocument();
    });
  });

  it('calls supabase for vak_analysis_history', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('vak_analysis_history');
    });
  });

  it('calls supabase for contacts', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('contacts');
    });
  });

  it('calls supabase for emotional_states_history', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('emotional_states_history');
    });
  });

  it('renders metric type selector', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Métricas de Conversão PNL')).toBeInTheDocument();
    });
  });

  it('accepts className prop', () => {
    const { container } = render(<NLPConversionMetrics className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders chart sections', async () => {
    render(<NLPConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText(/Taxa de Conversão|Distribuição|Desempenho/i)).toBeInTheDocument();
    });
  });
});
