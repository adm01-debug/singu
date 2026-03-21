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

import SubmodalityModifier from '../SubmodalityModifier';

describe('SubmodalityModifier', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText('Submodality Modifier')).toBeInTheDocument();
  });

  it('shows visual category', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText(/Visual/i)).toBeInTheDocument();
  });

  it('shows auditory category', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText(/Audit/i)).toBeInTheDocument();
  });

  it('shows kinesthetic category', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText(/Cinest|Kinest/i)).toBeInTheDocument();
  });

  it('shows brightness submodality', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText('Brilho')).toBeInTheDocument();
  });

  it('shows volume submodality', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('shows intensity submodality', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText('Intensidade')).toBeInTheDocument();
  });

  it('renders sliders for submodalities', () => {
    render(<SubmodalityModifier />);
    expect(screen.getByText('Escuro')).toBeInTheDocument();
    expect(screen.getByText('Brilhante')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<SubmodalityModifier className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<SubmodalityModifier />);
    expect(container).toBeTruthy();
  });
});
