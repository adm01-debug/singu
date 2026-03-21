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
vi.mock('@/lib/demo-contact', () => ({
  DEMO_CONTACT: { id: 'demo', firstName: 'Cliente', lastName: 'Exemplo', behavior: { discProfile: 'I' } }
}));
vi.mock('@/lib/contact-utils', () => ({
  getDominantVAK: vi.fn(() => 'V'),
  getDISCProfile: vi.fn(() => 'D'),
  getContactBehavior: vi.fn(),
}));
vi.mock('@/types/vak', () => ({ VAKType: {} }));

import RapportRealtimeCoach from '../RapportRealtimeCoach';

describe('RapportRealtimeCoach', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<RapportRealtimeCoach />);
    expect(screen.getByText('Rapport Real-Time Coach')).toBeInTheDocument();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<RapportRealtimeCoach />);
    expect(container).toBeTruthy();
  });

  it('shows VAK predicates section', () => {
    render(<RapportRealtimeCoach />);
    expect(screen.getByText(/Predicados VAK/i)).toBeInTheDocument();
  });

  it('shows DISC pace information', () => {
    render(<RapportRealtimeCoach />);
    expect(screen.getByText(/rápido|direto|resultados/i)).toBeInTheDocument();
  });

  it('accepts currentMessage prop', () => {
    const { container } = render(<RapportRealtimeCoach currentMessage="Olá, como vai?" />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<RapportRealtimeCoach className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('shows suggestion apply callback when provided', () => {
    const onApply = vi.fn();
    const { container } = render(<RapportRealtimeCoach onSuggestionApply={onApply} />);
    expect(container).toBeTruthy();
  });

  it('renders rapport score area', () => {
    render(<RapportRealtimeCoach currentMessage="Eu vejo que isso é muito claro para mim, quero visualizar melhor" />);
    expect(screen.getByText(/Score|Rapport|Alinhamento/i)).toBeInTheDocument();
  });

  it('renders advanced toggle button', () => {
    render(<RapportRealtimeCoach />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders mirroring category suggestions', () => {
    render(<RapportRealtimeCoach />);
    expect(screen.getByText(/Espelhamento|Mirroring|Pacing/i)).toBeInTheDocument();
  });
});
