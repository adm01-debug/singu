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
vi.mock('@/lib/contact-utils', () => ({
  getDominantVAK: vi.fn(() => 'V'),
  getDISCProfile: vi.fn(() => 'D'),
  getContactBehavior: vi.fn(),
}));
vi.mock('@/types/vak', () => ({ VAKType: {} }));

import StateElicitationToolkit from '../StateElicitationToolkit';

describe('StateElicitationToolkit', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText('State Elicitation Toolkit')).toBeInTheDocument();
  });

  it('shows curiosity state', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText('Curiosidade')).toBeInTheDocument();
  });

  it('shows confidence state', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/Confiança/)).toBeInTheDocument();
  });

  it('shows urgency state', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/Urgência/)).toBeInTheDocument();
  });

  it('shows desire state', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/Desejo/)).toBeInTheDocument();
  });

  it('shows commitment state', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/Comprometimento|Compromisso/)).toBeInTheDocument();
  });

  it('displays state descriptions', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/abertura e interesse/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<StateElicitationToolkit className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<StateElicitationToolkit />);
    expect(container).toBeTruthy();
  });

  it('shows use case for states', () => {
    render(<StateElicitationToolkit />);
    expect(screen.getByText(/início da conversa|reengajar/)).toBeInTheDocument();
  });
});
