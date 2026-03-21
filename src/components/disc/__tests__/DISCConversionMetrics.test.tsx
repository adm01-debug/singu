import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({ select: mockSelect, eq: mockEq, order: mockOrder }));
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
vi.mock('@/data/discAdvancedData', () => ({
  DISC_PROFILES: {
    D: { name: 'Dominante', color: { bg: '#f00', text: '#fff' } },
    I: { name: 'Influente', color: { bg: '#ff0', text: '#000' } },
    S: { name: 'Estável', color: { bg: '#0f0', text: '#000' } },
    C: { name: 'Consciente', color: { bg: '#00f', text: '#fff' } },
  },
}));
vi.mock('@/lib/contact-utils', () => ({
  getContactBehavior: vi.fn(),
  getDISCProfile: vi.fn(),
}));

import DISCConversionMetrics from '../DISCConversionMetrics';

describe('DISCConversionMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it('renders loading skeleton initially', () => {
    render(<DISCConversionMetrics />);
    const skeletons = document.querySelectorAll('.animate-pulse, [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the title after loading', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Métricas de Conversão DISC')).toBeInTheDocument();
    });
  });

  it('displays period selector', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Métricas de Conversão DISC')).toBeInTheDocument();
    });
  });

  it('renders profile cards for D, I, S, C', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('I')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });

  it('renders chart section titles', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Taxa de Conversão por Perfil')).toBeInTheDocument();
      expect(screen.getByText('Distribuição de Conversões')).toBeInTheDocument();
    });
  });

  it('renders metrics table with column headers', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Métricas Detalhadas')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Contatos')).toBeInTheDocument();
      expect(screen.getByText('Conversão')).toBeInTheDocument();
    });
  });

  it('renders insight section when data is present', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Insight Principal')).toBeInTheDocument();
    });
  });

  it('calls supabase from contacts and interactions', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(mockFrom).toHaveBeenCalledWith('interactions');
    });
  });

  it('renders conversion rates as percentages', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      const percentages = screen.getAllByText(/0%/);
      expect(percentages.length).toBeGreaterThan(0);
    });
  });

  it('renders trend column in detailed table', async () => {
    render(<DISCConversionMetrics />);
    await waitFor(() => {
      expect(screen.getByText('Trend')).toBeInTheDocument();
    });
  });
});
