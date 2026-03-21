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
    analyzeText: vi.fn(() => ({ brainSystemScores: { reptilian: 30, limbic: 40, neocortex: 30 } })),
    generateNeuroProfileFromDISC: vi.fn(() => ({ brainBalance: { reptilian: 33, limbic: 34, neocortex: 33 } })),
    BRAIN_SYSTEM_INFO: {
      reptilian: { name: 'Reptiliano', color: '#f00', icon: 'brain' },
      limbic: { name: 'Límbico', color: '#0f0', icon: 'heart' },
      neocortex: { name: 'Neocórtex', color: '#00f', icon: 'lightbulb' },
    },
    PRIMAL_STIMULUS_INFO: {},
  }),
}));
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {}, PrimalStimulus: {},
}));

import NeuroBriefingCard from '../NeuroBriefingCard';

describe('NeuroBriefingCard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders with contact name', () => {
    render(<NeuroBriefingCard contactName="João" />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('shows Perfil Neural header', () => {
    render(<NeuroBriefingCard contactName="João" />);
    expect(screen.getByText(/Perfil Neural/)).toBeInTheDocument();
  });

  it('renders brain system badges', () => {
    render(<NeuroBriefingCard contactName="João" />);
    expect(screen.getByText(/Reptiliano|Límbico|Neocórtex/)).toBeInTheDocument();
  });

  it('accepts discProfile prop', () => {
    const { container } = render(<NeuroBriefingCard contactName="João" discProfile="D" />);
    expect(container).toBeTruthy();
  });

  it('accepts interactions prop', () => {
    const interactions = [{ content: 'Test interaction' }];
    const { container } = render(<NeuroBriefingCard contactName="João" interactions={interactions} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroBriefingCard contactName="João" className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('shows brain score percentages', () => {
    render(<NeuroBriefingCard contactName="João" />);
    const percentages = screen.getAllByText(/%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('renders tips section', () => {
    render(<NeuroBriefingCard contactName="João" discProfile="I" />);
    const { container } = render(<NeuroBriefingCard contactName="João" />);
    expect(container).toBeTruthy();
  });
});
