import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockUseAccountChurnPrediction = vi.fn();
vi.mock('@/hooks/useAccountChurnPrediction', () => ({
  useAccountChurnPrediction: () => mockUseAccountChurnPrediction(),
}));

import { AccountChurnPredictionPanel } from '../AccountChurnPredictionPanel';

describe('AccountChurnPredictionPanel', () => {
  const defaultMock = {
    accountChurnAnalysis: [],
    atRiskAccounts: [],
    criticalCount: 0,
    highRiskCount: 0,
    portfolioHealthScore: 80,
    loading: false,
  };

  beforeEach(() => {
    mockUseAccountChurnPrediction.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<AccountChurnPredictionPanel />);
    expect(screen.getByText('Risco de Churn por Conta')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseAccountChurnPrediction.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<AccountChurnPredictionPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no at-risk accounts', () => {
    render(<AccountChurnPredictionPanel />);
    expect(screen.getByText('Nenhuma conta em risco')).toBeInTheDocument();
    expect(screen.getByText('Todas as suas contas estão saudáveis!')).toBeInTheDocument();
  });

  it('displays accounts when data is present', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskAccounts: [
        {
          companyId: 'c1',
          companyName: 'Acme Corp',
          riskScore: 75,
          riskLevel: 'high',
          confidenceLevel: 80,
          contacts: [],
          riskFactors: [],
          recommendedActions: ['Action 1'],
          championCount: 1,
          neutralCount: 2,
          blockerCount: 0,
          engagementTrend: 'declining',
          criticalAlerts: 1,
        },
      ],
      criticalCount: 0,
      highRiskCount: 1,
    });
    render(<AccountChurnPredictionPanel />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows portfolio health score', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      portfolioHealthScore: 65,
    });
    render(<AccountChurnPredictionPanel compact={false} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows critical and high risk counts', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      criticalCount: 2,
      highRiskCount: 3,
    });
    render(<AccountChurnPredictionPanel compact={false} />);
    expect(screen.getByText(/Crítico: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Alto: 3/)).toBeInTheDocument();
  });

  it('renders single account view when companyId is provided', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      accountChurnAnalysis: [
        {
          companyId: 'c1',
          companyName: 'Test Co',
          riskScore: 60,
          riskLevel: 'medium',
          confidenceLevel: 75,
          contacts: [],
          riskFactors: [{ factor: 'Low engagement', description: 'Desc', impact: 20, icon: '!' }],
          recommendedActions: ['Follow up'],
          championCount: 2,
          neutralCount: 1,
          blockerCount: 0,
          engagementTrend: 'stable',
          criticalAlerts: 0,
        },
      ],
    });
    render(<AccountChurnPredictionPanel companyId="c1" />);
    expect(screen.getByText('Risco de Churn da Conta')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows risk factors in single account view', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      accountChurnAnalysis: [
        {
          companyId: 'c1',
          companyName: 'Test Co',
          riskScore: 60,
          riskLevel: 'medium',
          confidenceLevel: 75,
          contacts: [],
          riskFactors: [{ factor: 'Low engagement', description: 'Not enough contact', impact: 20, icon: '!' }],
          recommendedActions: ['Follow up'],
          championCount: 0,
          neutralCount: 0,
          blockerCount: 0,
          engagementTrend: 'stable',
          criticalAlerts: 0,
        },
      ],
    });
    render(<AccountChurnPredictionPanel companyId="c1" />);
    expect(screen.getByText('Fatores de Risco')).toBeInTheDocument();
    expect(screen.getByText('Low engagement')).toBeInTheDocument();
  });

  it('shows recommended actions', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      accountChurnAnalysis: [
        {
          companyId: 'c1',
          companyName: 'Test Co',
          riskScore: 60,
          riskLevel: 'medium',
          confidenceLevel: 75,
          contacts: [],
          riskFactors: [],
          recommendedActions: ['Agendar reunião', 'Enviar proposta'],
          championCount: 0,
          neutralCount: 0,
          blockerCount: 0,
          engagementTrend: 'stable',
          criticalAlerts: 0,
        },
      ],
    });
    render(<AccountChurnPredictionPanel companyId="c1" />);
    expect(screen.getByText('Ações Recomendadas')).toBeInTheDocument();
    expect(screen.getByText('Agendar reunião')).toBeInTheDocument();
  });

  it('expands account details on click in portfolio view', () => {
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskAccounts: [
        {
          companyId: 'c1',
          companyName: 'Click Corp',
          riskScore: 70,
          riskLevel: 'high',
          confidenceLevel: 80,
          contacts: [],
          riskFactors: [{ factor: 'Test', description: 'Desc', impact: 10, icon: '!' }],
          recommendedActions: ['Do something'],
          championCount: 1,
          neutralCount: 0,
          blockerCount: 0,
          engagementTrend: 'declining',
          criticalAlerts: 0,
        },
      ],
    });
    render(<AccountChurnPredictionPanel />);
    const account = screen.getByText('Click Corp');
    fireEvent.click(account.closest('[class*="rounded"]')!);
    expect(screen.getByText('Fatores de Risco')).toBeInTheDocument();
  });

  it('limits displayed accounts in compact mode', () => {
    const accounts = Array.from({ length: 5 }, (_, i) => ({
      companyId: `c${i}`,
      companyName: `Company ${i}`,
      riskScore: 60 + i,
      riskLevel: 'medium' as const,
      confidenceLevel: 70,
      contacts: [],
      riskFactors: [],
      recommendedActions: [],
      championCount: 0,
      neutralCount: 0,
      blockerCount: 0,
      engagementTrend: 'stable' as const,
      criticalAlerts: 0,
    }));
    mockUseAccountChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskAccounts: accounts,
    });
    render(<AccountChurnPredictionPanel compact={true} />);
    expect(screen.getByText('Company 0')).toBeInTheDocument();
    expect(screen.getByText('Company 2')).toBeInTheDocument();
    expect(screen.queryByText('Company 3')).not.toBeInTheDocument();
  });
});
