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
vi.mock('@/types/vak', () => ({
  VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
  VAK_COMMUNICATION_TIPS: {},
  VAKType: {},
}));
vi.mock('@/types/metaprograms', () => ({
  METAPROGRAM_LABELS: {},
}));

import NLPTrainingMode from '../NLPTrainingMode';

describe('NLPTrainingMode', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('Modo Treinamento PNL')).toBeInTheDocument();
  });

  it('renders VAK tab', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('VAK')).toBeInTheDocument();
  });

  it('renders Metaprogramas tab', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('Metaprogramas')).toBeInTheDocument();
  });

  it('renders Combinado tab', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('Combinado')).toBeInTheDocument();
  });

  it('renders Prática tab', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('Prática')).toBeInTheDocument();
  });

  it('shows first scenario context', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText(/cliente está descrevendo|problema atual/i)).toBeInTheDocument();
  });

  it('displays client statement in quotes', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText(/vejo|visão|panorama/i)).toBeInTheDocument();
  });

  it('renders answer options with Visual/Auditivo labels', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByText('Auditivo')).toBeInTheDocument();
  });

  it('shows learning point after correct answer', () => {
    render(<NLPTrainingMode />);
    const visualOption = screen.getByText('Visual');
    fireEvent.click(visualOption);
    expect(screen.getByText(/Correto|Excelente|Visuais/i)).toBeInTheDocument();
  });

  it('renders progress indicator', () => {
    render(<NLPTrainingMode />);
    expect(screen.getByText(/1\//)).toBeInTheDocument();
  });
});
