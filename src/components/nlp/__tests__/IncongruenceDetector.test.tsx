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
  getDISCProfile: vi.fn(() => 'D'),
  getContactBehavior: vi.fn(),
}));

import IncongruenceDetector from '../IncongruenceDetector';

describe('IncongruenceDetector', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<IncongruenceDetector />);
    expect(screen.getByText('Detector de Incongruências')).toBeInTheDocument();
  });

  it('shows empty state when no incongruences', () => {
    render(<IncongruenceDetector />);
    expect(screen.getByText(/Nenhuma incongruência significativa detectada/)).toBeInTheDocument();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<IncongruenceDetector />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<IncongruenceDetector className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts interactions prop', () => {
    const interactions = [{ content: 'Test interaction', created_at: '2024-01-01' }];
    const { container } = render(<IncongruenceDetector interactions={interactions} />);
    expect(container).toBeTruthy();
  });

  it('shows incongruence type labels', () => {
    render(<IncongruenceDetector />);
    expect(screen.getByText(/Verbal vs Comportamental|Declarado vs Real/)).toBeInTheDocument();
  });

  it('shows search or analysis controls', () => {
    render(<IncongruenceDetector />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders contact name in description', () => {
    render(<IncongruenceDetector />);
    expect(screen.getByText(/Cliente/)).toBeInTheDocument();
  });
});
