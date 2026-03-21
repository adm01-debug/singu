import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      user_metadata: { first_name: 'Carlos' },
    },
  }),
  AuthProvider: ({ children }: any) => children,
}));
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
vi.mock('@/components/ui/typography', () => ({
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/surface', () => ({
  Surface: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/stat-card', () => ({
  MiniStat: ({ label, value }: any) => <div data-testid={`stat-${label}`}>{value} {label}</div>,
}));

import { WelcomeHeroCard } from '../WelcomeHeroCard';

describe('WelcomeHeroCard', () => {
  const defaultProps = {
    totalContacts: 42,
    weeklyInteractions: 15,
    averageScore: 78,
  };

  it('renders without crashing', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('shows greeting with user name', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('displays correct greeting based on time', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    // Greeting depends on current time
    const greeting = screen.getByText(/(Bom dia|Boa tarde|Boa noite)/);
    expect(greeting).toBeInTheDocument();
  });

  it('shows total contacts stat', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    expect(screen.getByTestId('stat-contatos')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('shows weekly interactions stat', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    expect(screen.getByTestId('stat-interações')).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('shows average score stat', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    expect(screen.getByTestId('stat-score')).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    render(<WelcomeHeroCard totalContacts={0} weeklyInteractions={0} averageScore={0} />);
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('renders with string averageScore', () => {
    render(<WelcomeHeroCard totalContacts={10} weeklyInteractions={5} averageScore="85" />);
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('renders today date', () => {
    render(<WelcomeHeroCard {...defaultProps} />);
    // The component formats today's date in pt-BR
    const container = document.body;
    expect(container.innerHTML).toContain('202');
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<WelcomeHeroCard {...defaultProps} />);
    expect(() => rerender(<WelcomeHeroCard {...defaultProps} />)).not.toThrow();
  });
});
