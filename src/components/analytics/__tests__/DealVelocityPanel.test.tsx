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

const mockUseDealVelocity = vi.fn();
vi.mock('@/hooks/useDealVelocity', () => ({
  useDealVelocity: () => mockUseDealVelocity(),
}));

import { DealVelocityPanel } from '../DealVelocityPanel';

describe('DealVelocityPanel', () => {
  const defaultMock = {
    metrics: null,
    loading: false,
  };

  beforeEach(() => {
    mockUseDealVelocity.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<DealVelocityPanel />);
    expect(screen.getByText('Velocidade do Pipeline')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseDealVelocity.mockReturnValue({ metrics: null, loading: true });
    const { container } = render(<DealVelocityPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no metrics', () => {
    render(<DealVelocityPanel />);
    expect(screen.getByText('Dados insuficientes')).toBeInTheDocument();
    expect(screen.getByText('Adicione contatos para análise')).toBeInTheDocument();
  });

  it('displays key metrics when data is present', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 14,
        projectedConversions: 5,
        totalActiveDeals: 20,
        bottleneckStage: 'negotiation',
        fastestStage: 'qualification',
        stageVelocities: [
          { stage: 'qualification', stageName: 'Qualificação', averageDays: 3, benchmark: 5, contactCount: 8, trend: 'improving' },
          { stage: 'negotiation', stageName: 'Negociação', averageDays: 10, benchmark: 7, contactCount: 6, trend: 'declining' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel />);
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('dias em média')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('conversões projetadas')).toBeInTheDocument();
  });

  it('shows deals count badge when not compact', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: null,
        fastestStage: null,
        stageVelocities: [],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel compact={false} />);
    expect(screen.getByText('15 deals ativos')).toBeInTheDocument();
  });

  it('shows bottleneck stage', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: 'proposal',
        fastestStage: 'discovery',
        stageVelocities: [
          { stage: 'proposal', stageName: 'Proposta', averageDays: 12, benchmark: 5, contactCount: 4, trend: 'declining' },
          { stage: 'discovery', stageName: 'Descoberta', averageDays: 2, benchmark: 5, contactCount: 3, trend: 'improving' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel />);
    expect(screen.getAllByText('Proposta').length).toBeGreaterThan(0);
    expect(screen.getByText('gargalo atual')).toBeInTheDocument();
  });

  it('shows fastest stage', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: null,
        fastestStage: 'qualification',
        stageVelocities: [
          { stage: 'qualification', stageName: 'Qualificação', averageDays: 2, benchmark: 5, contactCount: 5, trend: 'improving' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel />);
    expect(screen.getAllByText('Qualificação').length).toBeGreaterThan(0);
    expect(screen.getByText('mais rápido')).toBeInTheDocument();
  });

  it('shows stage velocities when not compact', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: null,
        fastestStage: null,
        stageVelocities: [
          { stage: 'discovery', stageName: 'Descoberta', averageDays: 3, benchmark: 5, contactCount: 4, trend: 'stable' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel compact={false} />);
    expect(screen.getByText('Tempo por Estágio')).toBeInTheDocument();
    expect(screen.getByText('4 contatos')).toBeInTheDocument();
  });

  it('hides stage velocities in compact mode', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: null,
        fastestStage: null,
        stageVelocities: [
          { stage: 'discovery', stageName: 'Descoberta', averageDays: 3, benchmark: 5, contactCount: 4, trend: 'stable' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel compact={true} />);
    expect(screen.queryByText('Tempo por Estágio')).not.toBeInTheDocument();
  });

  it('shows pipeline flow section when not compact', () => {
    mockUseDealVelocity.mockReturnValue({
      loading: false,
      metrics: {
        averageCycleTime: 10,
        projectedConversions: 3,
        totalActiveDeals: 15,
        bottleneckStage: null,
        fastestStage: null,
        stageVelocities: [
          { stage: 'discovery', stageName: 'Descoberta', averageDays: 3, benchmark: 5, contactCount: 4, trend: 'stable' },
        ],
        monthlyTrend: [],
      },
    });
    render(<DealVelocityPanel compact={false} />);
    expect(screen.getByText('Fluxo do Pipeline')).toBeInTheDocument();
  });
});
