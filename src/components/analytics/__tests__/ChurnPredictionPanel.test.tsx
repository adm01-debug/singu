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

const mockUseChurnPrediction = vi.fn();
vi.mock('@/hooks/useChurnPrediction', () => ({
  useChurnPrediction: () => mockUseChurnPrediction(),
}));

import { ChurnPredictionPanel } from '../ChurnPredictionPanel';

describe('ChurnPredictionPanel', () => {
  const defaultMock = {
    atRiskContacts: [],
    criticalCount: 0,
    highRiskCount: 0,
    averageRiskScore: 0,
    loading: false,
  };

  beforeEach(() => {
    mockUseChurnPrediction.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('Previsão de Churn')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseChurnPrediction.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<ChurnPredictionPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no at-risk contacts', () => {
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('Nenhum cliente em risco')).toBeInTheDocument();
    expect(screen.getByText('Seus relacionamentos estão saudáveis!')).toBeInTheDocument();
  });

  it('displays at-risk contacts when data is present', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: [
        {
          contactId: '1',
          contactName: 'John Doe',
          riskScore: 85,
          riskLevel: 'critical',
          daysSinceContact: 30,
          interactionTrend: 'decreasing',
          factors: [{ factor: 'No contact', impact: 40 }],
          recommendedAction: 'Ligar agora',
        },
      ],
      criticalCount: 1,
      highRiskCount: 0,
      averageRiskScore: 85,
    });
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
  });

  it('renders risk level badge correctly', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: [
        {
          contactId: '1',
          contactName: 'Jane',
          riskScore: 90,
          riskLevel: 'critical',
          daysSinceContact: 45,
          interactionTrend: 'decreasing',
          factors: [],
          recommendedAction: 'agendar reunião',
        },
      ],
      criticalCount: 1,
    });
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('Crítico')).toBeInTheDocument();
  });

  it('shows stats when not in compact mode', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      criticalCount: 2,
      highRiskCount: 3,
      averageRiskScore: 72,
    });
    render(<ChurnPredictionPanel compact={false} />);
    expect(screen.getByText(/Crítico: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Alto: 3/)).toBeInTheDocument();
    expect(screen.getAllByText('72%').length).toBeGreaterThan(0);
  });

  it('hides stats in compact mode', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      criticalCount: 2,
      highRiskCount: 3,
      averageRiskScore: 72,
    });
    render(<ChurnPredictionPanel compact={true} />);
    expect(screen.queryByText(/Crítico: 2/)).not.toBeInTheDocument();
  });

  it('respects maxItems prop', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => ({
      contactId: `${i}`,
      contactName: `Contact ${i}`,
      riskScore: 50 + i,
      riskLevel: 'medium' as const,
      daysSinceContact: 10 + i,
      interactionTrend: 'stable' as const,
      factors: [],
      recommendedAction: 'Enviar email',
    }));
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: contacts,
    });
    render(<ChurnPredictionPanel maxItems={3} />);
    expect(screen.getByText('Contact 0')).toBeInTheDocument();
    expect(screen.getByText('Contact 2')).toBeInTheDocument();
    expect(screen.queryByText('Contact 3')).not.toBeInTheDocument();
  });

  it('shows "Ver todos" link when more contacts than maxItems', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => ({
      contactId: `${i}`,
      contactName: `Contact ${i}`,
      riskScore: 50,
      riskLevel: 'medium' as const,
      daysSinceContact: 10,
      interactionTrend: 'stable' as const,
      factors: [],
      recommendedAction: 'Enviar email',
    }));
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: contacts,
    });
    render(<ChurnPredictionPanel maxItems={5} />);
    expect(screen.getByText(/Ver todos \(10\)/)).toBeInTheDocument();
  });

  it('displays days since contact info', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: [
        {
          contactId: '1',
          contactName: 'Test User',
          riskScore: 60,
          riskLevel: 'medium',
          daysSinceContact: 15,
          interactionTrend: 'stable',
          factors: [],
          recommendedAction: 'Enviar email',
        },
      ],
    });
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('15 dias sem contato')).toBeInTheDocument();
  });

  it('shows recommended action button', () => {
    mockUseChurnPrediction.mockReturnValue({
      ...defaultMock,
      atRiskContacts: [
        {
          contactId: '1',
          contactName: 'Test',
          riskScore: 70,
          riskLevel: 'high',
          daysSinceContact: 20,
          interactionTrend: 'decreasing',
          factors: [],
          recommendedAction: 'Ligar urgente',
        },
      ],
    });
    render(<ChurnPredictionPanel />);
    expect(screen.getByText('Ligar urgente')).toBeInTheDocument();
  });
});
