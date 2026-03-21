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
  getContactBehavior: vi.fn(),
}));
vi.mock('@/types/vak', () => ({ VAKType: {} }));

import SwishPatternGenerator from '../SwishPatternGenerator';

describe('SwishPatternGenerator', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<SwishPatternGenerator />);
    expect(screen.getByText('Swish Pattern Generator')).toBeInTheDocument();
  });

  it('shows common objections suggestions', () => {
    render(<SwishPatternGenerator />);
    expect(screen.getByText(/Medo de decidir errado/)).toBeInTheDocument();
  });

  it('shows preoccupation with price suggestion', () => {
    render(<SwishPatternGenerator />);
    expect(screen.getByText(/Preocupação com preço/)).toBeInTheDocument();
  });

  it('shows step-based builder', () => {
    render(<SwishPatternGenerator />);
    expect(screen.getByText(/Estado Atual|Passo|Etapa/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<SwishPatternGenerator className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<SwishPatternGenerator />);
    expect(container).toBeTruthy();
  });

  it('shows procrastination objection', () => {
    render(<SwishPatternGenerator />);
    expect(screen.getByText(/Procrastinação/)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<SwishPatternGenerator />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
