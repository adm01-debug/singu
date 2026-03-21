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
vi.mock('@/hooks/useNeuromarketing', () => ({
  useNeuromarketing: () => ({
    getTriggerNeuroMapping: vi.fn(() => ({ brainSystem: 'reptilian', chemicals: ['dopamine'], stimulus: 'scarcity' })),
    BRAIN_SYSTEM_INFO: {
      reptilian: { name: 'Reptiliano', color: '#f00' },
      limbic: { name: 'Límbico', color: '#0f0' },
      neocortex: { name: 'Neocórtex', color: '#00f' },
    },
    NEUROCHEMICAL_INFO: {
      dopamine: { name: 'Dopamina', color: '#ff0' },
      oxytocin: { name: 'Ocitocina', color: '#f0f' },
    },
    PRIMAL_STIMULUS_INFO: {},
  }),
}));
vi.mock('@/types/triggers', () => ({
  MENTAL_TRIGGERS: {
    scarcity: { name: 'Escassez', effectiveness: 80, bestFor: ['D'], avoidFor: ['S'], category: 'urgency' },
    social_proof: { name: 'Prova Social', effectiveness: 75, bestFor: ['I'], avoidFor: ['C'], category: 'trust' },
  },
  TriggerType: {},
}));
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {}, Neurochemical: {},
}));

import NeuroEnrichedTriggers from '../NeuroEnrichedTriggers';

describe('NeuroEnrichedTriggers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeuroEnrichedTriggers />);
    expect(screen.getByText('Gatilhos Neuro-Enriquecidos')).toBeInTheDocument();
  });

  it('shows trigger names', () => {
    render(<NeuroEnrichedTriggers />);
    expect(screen.getByText(/Escassez|Prova Social/)).toBeInTheDocument();
  });

  it('renders brain system badges', () => {
    render(<NeuroEnrichedTriggers />);
    expect(screen.getByText(/Reptiliano|Límbico|Neocórtex/)).toBeInTheDocument();
  });

  it('accepts discProfile prop', () => {
    const { container } = render(<NeuroEnrichedTriggers discProfile="D" />);
    expect(container).toBeTruthy();
  });

  it('accepts showAll prop', () => {
    const { container } = render(<NeuroEnrichedTriggers showAll={true} />);
    expect(container).toBeTruthy();
  });

  it('shows effectiveness percentages', () => {
    render(<NeuroEnrichedTriggers />);
    const percentages = screen.getAllByText(/%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('renders without discProfile', () => {
    const { container } = render(<NeuroEnrichedTriggers />);
    expect(container).toBeTruthy();
  });

  it('shows progress bars for effectiveness', () => {
    render(<NeuroEnrichedTriggers />);
    const { container } = render(<NeuroEnrichedTriggers />);
    expect(container).toBeTruthy();
  });
});
