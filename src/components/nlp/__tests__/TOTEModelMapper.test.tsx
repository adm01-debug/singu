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

import TOTEModelMapper from '../TOTEModelMapper';

describe('TOTEModelMapper', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<TOTEModelMapper />);
    expect(screen.getByText('TOTE Model Mapper')).toBeInTheDocument();
  });

  it('shows test1 phase', () => {
    render(<TOTEModelMapper />);
    expect(screen.getByText(/Test|Teste 1/i)).toBeInTheDocument();
  });

  it('shows operate phase', () => {
    render(<TOTEModelMapper />);
    expect(screen.getByText(/Operate|Operar/i)).toBeInTheDocument();
  });

  it('shows test2 phase', () => {
    render(<TOTEModelMapper />);
    expect(screen.getByText(/Test|Teste 2/i)).toBeInTheDocument();
  });

  it('shows exit phase', () => {
    render(<TOTEModelMapper />);
    expect(screen.getByText(/Exit|Saída/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<TOTEModelMapper className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts decisionContext prop', () => {
    const { container } = render(<TOTEModelMapper decisionContext="Compra de software" />);
    expect(container).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<TOTEModelMapper />);
    expect(container).toBeTruthy();
  });

  it('renders observation textarea', () => {
    render(<TOTEModelMapper />);
    const textareas = document.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });

  it('renders phase navigation buttons', () => {
    render(<TOTEModelMapper />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
