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
vi.mock('@/components/ui/optimized-avatar', () => ({
  OptimizedAvatar: ({ alt }: any) => <div data-testid="avatar">{alt}</div>,
}));

const mockUseClosingScoreRanking = vi.fn();
vi.mock('@/hooks/useClosingScoreRanking', () => ({
  useClosingScoreRanking: (...args: any[]) => mockUseClosingScoreRanking(...args),
}));

import { ClosingScoreRanking } from '../ClosingScoreRanking';

describe('ClosingScoreRanking', () => {
  const defaultStats = {
    totalContacts: 0,
    averageScore: 0,
    highProbability: 0,
    mediumProbability: 0,
    lowProbability: 0,
    veryLowProbability: 0,
  };

  const defaultMock = {
    rankings: [],
    loading: false,
    refreshing: false,
    stats: defaultStats,
    refresh: vi.fn(),
  };

  beforeEach(() => {
    mockUseClosingScoreRanking.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<ClosingScoreRanking />);
    expect(screen.getByText('Ranking de Fechamento')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseClosingScoreRanking.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<ClosingScoreRanking />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no rankings', () => {
    render(<ClosingScoreRanking />);
    expect(screen.getByText('Nenhum contato encontrado')).toBeInTheDocument();
  });

  it('displays total contacts badge', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      stats: { ...defaultStats, totalContacts: 42 },
    });
    render(<ClosingScoreRanking />);
    expect(screen.getByText('42 contatos')).toBeInTheDocument();
  });

  it('shows stats overview when showStats is true and not compact', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      stats: { ...defaultStats, averageScore: 65, highProbability: 10, mediumProbability: 15, lowProbability: 8, veryLowProbability: 5 },
    });
    render(<ClosingScoreRanking showStats={true} compact={false} />);
    expect(screen.getByText('Score Médio')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('hides stats overview when compact', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      stats: { ...defaultStats, averageScore: 65 },
    });
    render(<ClosingScoreRanking compact={true} />);
    expect(screen.queryByText('Score Médio')).not.toBeInTheDocument();
  });

  it('renders ranking items with contact info', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      rankings: [
        {
          contact: { id: '1', first_name: 'Alice', last_name: 'Silva', avatar_url: null },
          score: 85,
          probability: 'high',
          trend: 'up',
          interactionCount: 12,
          lastInteractionDays: 2,
          topStrength: 'Engajamento',
          mainWeakness: 'Nenhuma',
          nextAction: 'Fechar agora',
        },
      ],
      stats: { ...defaultStats, totalContacts: 1 },
    });
    render(<ClosingScoreRanking />);
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows "show more" button when rankings exceed maxItems', () => {
    const rankings = Array.from({ length: 10 }, (_, i) => ({
      contact: { id: `${i}`, first_name: `User`, last_name: `${i}`, avatar_url: null },
      score: 50 + i,
      probability: 'medium' as const,
      trend: 'stable' as const,
      interactionCount: 5,
      lastInteractionDays: 3,
      topStrength: 'Test',
      mainWeakness: 'Nenhuma',
      nextAction: 'Test',
    }));
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      rankings,
      stats: { ...defaultStats, totalContacts: 10 },
    });
    render(<ClosingScoreRanking maxItems={3} />);
    expect(screen.getByText(/Ver mais 7 contatos/)).toBeInTheDocument();
  });

  it('shows "Fechar agora!" badge for high probability items', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      rankings: [
        {
          contact: { id: '1', first_name: 'Bob', last_name: 'Test', avatar_url: null },
          score: 90,
          probability: 'high',
          trend: 'up',
          interactionCount: 20,
          lastInteractionDays: 0,
          topStrength: 'Alto engajamento',
          mainWeakness: 'Nenhuma',
          nextAction: 'Fechar',
        },
      ],
      stats: { ...defaultStats, totalContacts: 1 },
    });
    render(<ClosingScoreRanking compact={false} />);
    expect(screen.getByText('Fechar agora!')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    const refreshFn = vi.fn();
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      refresh: refreshFn,
    });
    const { container } = render(<ClosingScoreRanking />);
    // Refresh button is the one with RefreshCw icon
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays interaction count and last interaction info', () => {
    mockUseClosingScoreRanking.mockReturnValue({
      ...defaultMock,
      rankings: [
        {
          contact: { id: '1', first_name: 'Test', last_name: 'User', avatar_url: null },
          score: 60,
          probability: 'medium',
          trend: 'stable',
          interactionCount: 8,
          lastInteractionDays: 5,
          topStrength: 'Consistência',
          mainWeakness: 'Frequência',
          nextAction: 'Agendar',
        },
      ],
      stats: { ...defaultStats, totalContacts: 1 },
    });
    render(<ClosingScoreRanking compact={false} />);
    expect(screen.getByText('8 interações')).toBeInTheDocument();
    expect(screen.getByText('5d atrás')).toBeInTheDocument();
  });
});
