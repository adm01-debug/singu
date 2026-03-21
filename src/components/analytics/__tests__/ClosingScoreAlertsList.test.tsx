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

const mockUseClosingScoreAlerts = vi.fn();
vi.mock('@/hooks/useClosingScoreAlerts', () => ({
  useClosingScoreAlerts: () => mockUseClosingScoreAlerts(),
}));

import { ClosingScoreAlertsList } from '../ClosingScoreAlertsList';

describe('ClosingScoreAlertsList', () => {
  const defaultMock = {
    alerts: [],
    loading: false,
    dismissAlert: vi.fn(),
    dismissAllAlerts: vi.fn(),
    refreshAlerts: vi.fn(),
    probabilityLabels: { high: 'Alta', medium: 'Média', low: 'Baixa', very_low: 'Muito Baixa' },
  };

  beforeEach(() => {
    mockUseClosingScoreAlerts.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Alertas de Score de Fechamento')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseClosingScoreAlerts.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<ClosingScoreAlertsList />);
    const skeletons = container.querySelectorAll('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no alerts', () => {
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Nenhum alerta de mudança significativa')).toBeInTheDocument();
  });

  it('displays empty state hint', () => {
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText(/Você será notificado quando scores mudarem/)).toBeInTheDocument();
  });

  it('renders alert items with improved_to_high type', () => {
    mockUseClosingScoreAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        {
          id: 'a1',
          contact_id: 'c1',
          contact_name: 'Alice Winner',
          change_type: 'improved_to_high',
          current_score: 90,
          previous_score: 60,
          created_at: new Date().toISOString(),
        },
      ],
    });
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Alice Winner')).toBeInTheDocument();
    expect(screen.getByText(/Probabilidade Alta/)).toBeInTheDocument();
  });

  it('renders alert items with dropped_to_very_low type', () => {
    mockUseClosingScoreAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        {
          id: 'a2',
          contact_id: 'c2',
          contact_name: 'Bob Dropped',
          change_type: 'dropped_to_very_low',
          current_score: 15,
          previous_score: 65,
          created_at: new Date().toISOString(),
        },
      ],
    });
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Bob Dropped')).toBeInTheDocument();
    expect(screen.getByText(/Probabilidade Muito Baixa/)).toBeInTheDocument();
  });

  it('shows alert count badge', () => {
    mockUseClosingScoreAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        { id: 'a1', contact_id: 'c1', contact_name: 'Test', change_type: 'improved_to_high', current_score: 90, previous_score: 60, created_at: new Date().toISOString() },
        { id: 'a2', contact_id: 'c2', contact_name: 'Test2', change_type: 'improved_to_high', current_score: 85, previous_score: 55, created_at: new Date().toISOString() },
      ],
    });
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows "Momento ideal para fechar!" button for high probability', () => {
    mockUseClosingScoreAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        { id: 'a1', contact_id: 'c1', contact_name: 'Hot Lead', change_type: 'improved_to_high', current_score: 92, previous_score: 60, created_at: new Date().toISOString() },
      ],
    });
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Momento ideal para fechar!')).toBeInTheDocument();
  });

  it('shows "Avaliar situação e agir" button for very low drop', () => {
    mockUseClosingScoreAlerts.mockReturnValue({
      ...defaultMock,
      alerts: [
        { id: 'a1', contact_id: 'c1', contact_name: 'Cold Lead', change_type: 'dropped_to_very_low', current_score: 10, previous_score: 60, created_at: new Date().toISOString() },
      ],
    });
    render(<ClosingScoreAlertsList />);
    expect(screen.getByText('Avaliar situação e agir')).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    render(<ClosingScoreAlertsList showHeader={false} />);
    expect(screen.queryByText('Alertas de Score de Fechamento')).not.toBeInTheDocument();
  });

  it('respects maxItems prop', () => {
    const alerts = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      contact_id: `c${i}`,
      contact_name: `User ${i}`,
      change_type: 'improved_to_high',
      current_score: 90,
      previous_score: 50,
      created_at: new Date().toISOString(),
    }));
    mockUseClosingScoreAlerts.mockReturnValue({ ...defaultMock, alerts });
    render(<ClosingScoreAlertsList maxItems={3} />);
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.queryByText('User 3')).not.toBeInTheDocument();
  });

  it('shows "Ver mais" when alerts exceed maxItems', () => {
    const alerts = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      contact_id: `c${i}`,
      contact_name: `User ${i}`,
      change_type: 'improved_to_high',
      current_score: 90,
      previous_score: 50,
      created_at: new Date().toISOString(),
    }));
    mockUseClosingScoreAlerts.mockReturnValue({ ...defaultMock, alerts });
    render(<ClosingScoreAlertsList maxItems={5} />);
    expect(screen.getByText(/Ver mais 5 alertas/)).toBeInTheDocument();
  });
});
