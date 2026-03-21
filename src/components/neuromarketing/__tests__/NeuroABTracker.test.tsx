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
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {}, PrimalStimulus: {}, Neurochemical: {},
}));
vi.mock('@/data/neuromarketingData', () => ({
  BRAIN_SYSTEM_INFO: {
    reptilian: { name: 'Reptiliano', color: '#f00' },
    limbic: { name: 'Límbico', color: '#0f0' },
    neocortex: { name: 'Neocórtex', color: '#00f' },
  },
  PRIMAL_STIMULUS_INFO: {},
  NEUROCHEMICAL_INFO: {},
}));

import NeuroABTracker from '../NeuroABTracker';

describe('NeuroABTracker', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeuroABTracker />);
    expect(screen.getByText('Neuro A/B Tracker')).toBeInTheDocument();
  });

  it('shows empty state when no results', () => {
    render(<NeuroABTracker />);
    expect(screen.getByText(/Nenhum teste A\/B registrado/)).toBeInTheDocument();
  });

  it('renders brain tab', () => {
    render(<NeuroABTracker />);
    expect(screen.getByText(/Cérebro|Brain/i)).toBeInTheDocument();
  });

  it('renders stimulus tab', () => {
    render(<NeuroABTracker />);
    expect(screen.getByText(/Estímulo|Stimulus/i)).toBeInTheDocument();
  });

  it('renders chemical tab', () => {
    render(<NeuroABTracker />);
    expect(screen.getByText(/Químico|Chemical/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroABTracker className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts contactName prop', () => {
    render(<NeuroABTracker contactName="João" />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('renders record result controls', () => {
    render(<NeuroABTracker />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts onRecordResult callback', () => {
    const onRecord = vi.fn();
    const { container } = render(<NeuroABTracker onRecordResult={onRecord} />);
    expect(container).toBeTruthy();
  });

  it('accepts results prop', () => {
    const { container } = render(<NeuroABTracker results={[]} />);
    expect(container).toBeTruthy();
  });
});
