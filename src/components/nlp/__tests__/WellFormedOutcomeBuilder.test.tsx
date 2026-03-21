import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/demo-contact', () => ({
  DEMO_CONTACT: { id: 'demo', firstName: 'Cliente', lastName: 'Exemplo', behavior: { discProfile: 'I' } }
}));

import WellFormedOutcomeBuilder from '../WellFormedOutcomeBuilder';

describe('WellFormedOutcomeBuilder', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText('Well-Formed Outcome Builder')).toBeInTheDocument();
  });

  it('shows Positivo criterion', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText('Positivo')).toBeInTheDocument();
  });

  it('shows Evidência Sensorial criterion', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText('Evidência Sensorial')).toBeInTheDocument();
  });

  it('shows Auto-Iniciado criterion', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText('Auto-Iniciado')).toBeInTheDocument();
  });

  it('shows Contexto Específico criterion', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText('Contexto Específico')).toBeInTheDocument();
  });

  it('displays criterion questions', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText(/O que você QUER/)).toBeInTheDocument();
  });

  it('shows progress tracking', () => {
    render(<WellFormedOutcomeBuilder />);
    expect(screen.getByText(/0\/7|progresso|Progresso/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<WellFormedOutcomeBuilder className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<WellFormedOutcomeBuilder />);
    expect(container).toBeTruthy();
  });

  it('renders textareas for answers', () => {
    render(<WellFormedOutcomeBuilder />);
    const textareas = document.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });
});
