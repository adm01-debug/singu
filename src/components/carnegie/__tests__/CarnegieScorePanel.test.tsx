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
vi.mock('@/components/micro-interactions', () => ({
  MorphingNumber: ({ value }: any) => <span data-testid="morphing-number">{value}</span>,
}));

import { CarnegieScorePanel } from '../CarnegieScorePanel';

describe('CarnegieScorePanel', () => {
  const defaultScore = {
    overall: 72,
    level: 'proficient' as const,
    components: {
      nobleCause: 80,
      identityLabeling: 70,
      appreciation: 85,
      talkRatio: 60,
      warmth: 75,
      faceSaving: 65,
      vulnerability: 55,
      progressCelebration: 78,
    },
    strengths: ['appreciation', 'nobleCause'],
    improvements: ['vulnerability', 'talkRatio'],
    tips: ['Focus on vulnerability', 'Improve talk ratio'],
  };

  it('renders without crashing', () => {
    const { container } = render(<CarnegieScorePanel score={defaultScore} />);
    expect(container).toBeTruthy();
  });

  it('displays overall score', () => {
    render(<CarnegieScorePanel score={defaultScore} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('shows level label', () => {
    render(<CarnegieScorePanel score={defaultScore} />);
    expect(screen.getByText('Proficiente')).toBeInTheDocument();
  });

  it('renders component labels', () => {
    render(<CarnegieScorePanel score={defaultScore} />);
    expect(screen.getByText('Apreciação')).toBeInTheDocument();
    expect(screen.getByText('Causa Nobre')).toBeInTheDocument();
  });

  it('renders with expert level', () => {
    const expertScore = { ...defaultScore, overall: 90, level: 'expert' as const };
    render(<CarnegieScorePanel score={expertScore} />);
    expect(screen.getByText('Especialista')).toBeInTheDocument();
  });

  it('renders with novice level', () => {
    const noviceScore = { ...defaultScore, overall: 20, level: 'novice' as const };
    render(<CarnegieScorePanel score={noviceScore} />);
    expect(screen.getByText('Novato')).toBeInTheDocument();
  });

  it('renders with master level', () => {
    const masterScore = { ...defaultScore, overall: 98, level: 'master' as const };
    render(<CarnegieScorePanel score={masterScore} />);
    expect(screen.getByText('Mestre Carnegie')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<CarnegieScorePanel score={defaultScore} className="custom" />);
    expect(container).toBeTruthy();
  });

  it('renders progress bars for components', () => {
    const { container } = render(<CarnegieScorePanel score={defaultScore} />);
    const progressBars = container.querySelectorAll('[role="progressbar"], [class*="progress"], [class*="Progress"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows all component labels', () => {
    render(<CarnegieScorePanel score={defaultScore} />);
    expect(screen.getByText('Proporção de Fala')).toBeInTheDocument();
    expect(screen.getByText('Calor Humano')).toBeInTheDocument();
    expect(screen.getByText('Salvar a Face')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilidade')).toBeInTheDocument();
    expect(screen.getByText('Celebrar Progresso')).toBeInTheDocument();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<CarnegieScorePanel score={defaultScore} />);
    expect(() => rerender(<CarnegieScorePanel score={defaultScore} />)).not.toThrow();
  });
});
