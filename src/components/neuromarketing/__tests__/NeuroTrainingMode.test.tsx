import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {}, PrimalStimulus: {},
}));
vi.mock('@/data/neuromarketingData', () => ({
  BRAIN_SYSTEM_INFO: {
    reptilian: { name: 'Reptiliano', color: '#f00' },
    limbic: { name: 'Límbico', color: '#0f0' },
    neocortex: { name: 'Neocórtex', color: '#00f' },
  },
  PRIMAL_STIMULUS_INFO: {},
}));

import NeuroTrainingMode from '../NeuroTrainingMode';

describe('NeuroTrainingMode', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeuroTrainingMode />);
    expect(screen.getByText('Neuro Training Mode')).toBeInTheDocument();
  });

  it('shows start button', () => {
    render(<NeuroTrainingMode />);
    expect(screen.getByText('Iniciar Treinamento')).toBeInTheDocument();
  });

  it('shows first scenario after starting', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    expect(screen.getByText(/Preciso resolver isso AGORA/)).toBeInTheDocument();
  });

  it('shows answer options after starting', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    expect(screen.getByText('Cérebro Reptiliano')).toBeInTheDocument();
    expect(screen.getByText('Cérebro Límbico')).toBeInTheDocument();
    expect(screen.getByText('Neocórtex')).toBeInTheDocument();
  });

  it('shows correct answer feedback', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    fireEvent.click(screen.getByText('Cérebro Reptiliano'));
    expect(screen.getByText(/ativado por ameaças|Correto|urgência/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroTrainingMode className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts onComplete callback', () => {
    const onComplete = vi.fn();
    const { container } = render(<NeuroTrainingMode onComplete={onComplete} />);
    expect(container).toBeTruthy();
  });

  it('shows progress indicator during training', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    expect(screen.getByText(/1\//)).toBeInTheDocument();
  });

  it('shows hint for each question', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    expect(screen.getByText(/sobrevivência|medo|urgência/i)).toBeInTheDocument();
  });

  it('renders question count badge', () => {
    render(<NeuroTrainingMode />);
    fireEvent.click(screen.getByText('Iniciar Treinamento'));
    expect(screen.getByText(/8 questões|1\/8/i)).toBeInTheDocument();
  });
});
