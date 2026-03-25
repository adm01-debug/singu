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
      reptilian: { name: 'Reptiliano', color: '#f00' },
      limbic: { name: 'Límbico', color: '#0f0' },
      neocortex: { name: 'Neocórtex', color: '#00f' },
    },
  }),
}));
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {},
}));
vi.mock('date-fns', () => ({
  format: vi.fn((d) => '01/01/2024'),
  differenceInDays: vi.fn(() => 1),
  parseISO: vi.fn((s) => new Date(s)),
}));
vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

import NeuroTimeline from '../NeuroTimeline';

describe('NeuroTimeline', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeuroTimeline />);
    expect(screen.getByText('Evolução Neural')).toBeInTheDocument();
  });

  it('shows empty state when no interactions', () => {
    render(<NeuroTimeline />);
    expect(screen.getByText(/Nenhuma|Sem dados|interações/i)).toBeInTheDocument();
  });

  it('shows contact name', () => {
    render(<NeuroTimeline contactName="João" />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('accepts discProfile prop', () => {
    const { container } = render(<NeuroTimeline discProfile="D" />);
    expect(container).toBeTruthy();
  });

  it('accepts maxEntries prop', () => {
    const { container } = render(<NeuroTimeline maxEntries={3} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroTimeline className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders with interactions', () => {
    const interactions = [
      { content: 'Test content', created_at: '2024-01-01T00:00:00Z' },
      { content: 'Another test', created_at: '2024-01-02T00:00:00Z' },
    ];
    const { container } = render(<NeuroTimeline interactions={interactions} />);
    expect(container).toBeTruthy();
  });

  it('renders navigation buttons when timeline has entries', () => {
    const interactions = [
      { content: 'Test content long enough to analyze properly for the system', created_at: '2024-01-01T00:00:00Z' },
    ];
    const { container } = render(<NeuroTimeline interactions={interactions} />);
    expect(container).toBeTruthy();
  });
});
