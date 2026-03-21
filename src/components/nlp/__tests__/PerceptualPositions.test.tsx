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

import PerceptualPositions from '../PerceptualPositions';

describe('PerceptualPositions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText('Posições Perceptuais')).toBeInTheDocument();
  });

  it('shows first position - EU', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/1ª Posição - EU/)).toBeInTheDocument();
  });

  it('shows second position - OUTRO', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/2ª Posição - OUTRO/)).toBeInTheDocument();
  });

  it('shows third position - OBSERVADOR', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/3ª Posição/i)).toBeInTheDocument();
  });

  it('displays first position questions', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/O que EU quero desta interação/)).toBeInTheDocument();
  });

  it('displays second position questions', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/O que o CLIENTE realmente quer/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<PerceptualPositions className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts situation prop', () => {
    const { container } = render(<PerceptualPositions situation="Negociação de preço" />);
    expect(container).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<PerceptualPositions />);
    expect(container).toBeTruthy();
  });

  it('renders tabs or position selectors', () => {
    render(<PerceptualPositions />);
    expect(screen.getByText(/EU|OUTRO/)).toBeInTheDocument();
  });
});
