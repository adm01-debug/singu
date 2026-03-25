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

vi.mock('@/hooks/useCarnegieAnalysis', () => ({
  useCarnegieAnalysis: () => ({
    calculateCarnegieScore: (warmth: number) => ({
      overall: 72,
      level: 'proficient',
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
      strengths: ['appreciation'],
      improvements: ['vulnerability'],
      tips: ['Focus on vulnerability'],
    }),
    discProfile: 'I',
    analyzeWarmth: vi.fn(),
    analyzeTalkRatio: vi.fn(),
    getNobleCauses: () => [],
    getIdentityLabels: () => [],
  }),
}));

// Mock all sub-panels
vi.mock('../CarnegieScorePanel', () => ({
  CarnegieScorePanel: ({ score }: any) => <div data-testid="score-panel">Score: {score?.overall}</div>,
}));
vi.mock('../WarmthAnalyzerPanel', () => ({
  WarmthAnalyzerPanel: () => <div data-testid="warmth-panel">Warmth</div>,
}));
vi.mock('../NobleCausePanel', () => ({
  NobleCausePanel: () => <div data-testid="noble-panel">Noble</div>,
}));
vi.mock('../IdentityLabelingPanel', () => ({
  IdentityLabelingPanel: () => <div data-testid="identity-panel">Identity</div>,
}));
vi.mock('../TalkRatioPanel', () => ({
  TalkRatioPanel: () => <div data-testid="talk-panel">Talk</div>,
}));
vi.mock('../FaceSavingPanel', () => ({
  FaceSavingPanel: () => <div data-testid="face-panel">Face</div>,
}));
vi.mock('../VulnerabilityPanel', () => ({
  VulnerabilityPanel: () => <div data-testid="vulnerability-panel">Vulnerability</div>,
}));
vi.mock('../ProgressCelebrationPanel', () => ({
  ProgressCelebrationPanel: () => <div data-testid="progress-panel">Progress</div>,
}));
vi.mock('../AppreciationPanel', () => ({
  AppreciationPanel: () => <div data-testid="appreciation-panel">Appreciation</div>,
}));

import { CarnegieDashboard } from '../CarnegieDashboard';

describe('CarnegieDashboard', () => {
  it('renders without crashing', () => {
    render(<CarnegieDashboard />);
    expect(screen.getByText('Princípios de Carnegie')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<CarnegieDashboard />);
    expect(screen.getByText(/Como Fazer Amigos e Influenciar Pessoas/)).toBeInTheDocument();
  });

  it('renders overview tab by default', () => {
    render(<CarnegieDashboard />);
    expect(screen.getByTestId('score-panel')).toBeInTheDocument();
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    render(<CarnegieDashboard contact={contact} />);
    expect(screen.getByText('Princípios de Carnegie')).toBeInTheDocument();
  });

  it('renders with null contact', () => {
    render(<CarnegieDashboard contact={null} />);
    expect(screen.getByText('Princípios de Carnegie')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<CarnegieDashboard className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders tab navigation', () => {
    render(<CarnegieDashboard />);
    const tabs = document.querySelectorAll('[role="tab"], [data-state]');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('displays score panel in overview', () => {
    render(<CarnegieDashboard />);
    expect(screen.getByText('Score: 72')).toBeInTheDocument();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<CarnegieDashboard />);
    expect(() => rerender(<CarnegieDashboard />)).not.toThrow();
  });

  it('renders the heading with icon', () => {
    const { container } = render(<CarnegieDashboard />);
    expect(container.querySelector('h2')).toBeTruthy();
  });
});
