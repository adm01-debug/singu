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

const mockDismissAlert = vi.fn();
const mockMarkActionTaken = vi.fn();
const mockDetectNewAlerts = vi.fn().mockResolvedValue(undefined);
const mockUseBehaviorAlerts = vi.fn();
vi.mock('@/hooks/useBehaviorAlerts', () => ({
  useBehaviorAlerts: () => mockUseBehaviorAlerts(),
}));

import { BehaviorAlertsPanel } from '../BehaviorAlertsPanel';

describe('BehaviorAlertsPanel', () => {
  const defaultMock = {
    alerts: [],
    stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    loading: false,
    detectNewAlerts: mockDetectNewAlerts,
    dismissAlert: mockDismissAlert,
    markActionTaken: mockMarkActionTaken,
    ALERT_TYPE_CONFIG: {
      sentiment_drop: { icon: '📉' },
      engagement_drop: { icon: '📉' },
      churn_risk: { icon: '⚠️' },
      purchase_overdue: { icon: '🛒' },
      communication_gap: { icon: '💬' },
      relationship_score_drop: { icon: '📉' },
      positive_momentum: { icon: '📈' },
    },
  };

  beforeEach(() => {
    mockUseBehaviorAlerts.mockReturnValue(defaultMock);
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('Alertas Inteligentes')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseBehaviorAlerts.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<BehaviorAlertsPanel />);
    const skeletons = container.querySelectorAll('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no alerts', () => {
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText(/Nenhum alerta/)).toBeInTheDocument();
  });

  it('displays description text', () => {
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('Mudanças comportamentais detectadas')).toBeInTheDocument();
  });

  it('shows critical badge when there are critical alerts', () => {
    mockUseBehaviorAlerts.mockReturnValue({
      ...defaultMock,
      stats: { total: 3, critical: 2, high: 1, medium: 0, low: 0 },
    });
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText(/2 crítico/)).toBeInTheDocument();
  });

  it('renders alert items', () => {
    mockUseBehaviorAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        {
          id: 'a1',
          contactId: 'c1',
          contactName: 'John Alert',
          type: 'churn_risk',
          severity: 'critical',
          title: 'Risco de Churn',
          description: 'Contact showing churn signals',
          detectedAt: new Date().toISOString(),
          recommendedAction: 'Ligar agora',
          changePercent: -25,
        },
      ],
      stats: { total: 1, critical: 1, high: 0, medium: 0, low: 0 },
    });
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('John Alert')).toBeInTheDocument();
    expect(screen.getByText('Risco de Churn')).toBeInTheDocument();
  });

  it('shows recommended action', () => {
    mockUseBehaviorAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        {
          id: 'a1',
          contactId: 'c1',
          contactName: 'Test',
          type: 'engagement_drop',
          severity: 'high',
          title: 'Drop',
          description: 'Desc',
          detectedAt: new Date().toISOString(),
          recommendedAction: 'Enviar mensagem personalizada',
        },
      ],
      stats: { total: 1, critical: 0, high: 1, medium: 0, low: 0 },
    });
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('Enviar mensagem personalizada')).toBeInTheDocument();
  });

  it('shows severity stats badges', () => {
    mockUseBehaviorAlerts.mockReturnValue({
      ...defaultMock,
      stats: { total: 10, critical: 2, high: 3, medium: 4, low: 1 },
    });
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('2 Crítico')).toBeInTheDocument();
    expect(screen.getByText('3 Alto')).toBeInTheDocument();
    expect(screen.getByText('4 Médio')).toBeInTheDocument();
    expect(screen.getByText('1 Positivo')).toBeInTheDocument();
  });

  it('limits alerts in compact mode', () => {
    const alerts = Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`,
      contactId: `c${i}`,
      contactName: `User ${i}`,
      type: 'engagement_drop' as const,
      severity: 'medium' as const,
      title: `Alert ${i}`,
      description: 'Desc',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Action',
    }));
    mockUseBehaviorAlerts.mockReturnValue({
      ...defaultMock,
      alerts,
      stats: { total: 5, critical: 0, high: 0, medium: 5, low: 0 },
    });
    render(<BehaviorAlertsPanel compact={true} />);
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.queryByText('User 3')).not.toBeInTheDocument();
  });

  it('shows "Verificar agora" button in empty state', () => {
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('Verificar agora')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<BehaviorAlertsPanel />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
