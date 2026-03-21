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

import ChunkingNavigator from '../ChunkingNavigator';

describe('ChunkingNavigator', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText('Chunking Navigator')).toBeInTheDocument();
  });

  it('shows abstract chunk level', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/CHUNK UP - Abstrato/)).toBeInTheDocument();
  });

  it('shows mid chunk level', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/CHUNK LATERAL - Paralelo/)).toBeInTheDocument();
  });

  it('shows specific chunk level', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/CHUNK DOWN - Específico/)).toBeInTheDocument();
  });

  it('displays chunk up questions', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/Para que você quer isso/)).toBeInTheDocument();
  });

  it('displays chunk down questions', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/Como especificamente/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<ChunkingNavigator className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts topic prop', () => {
    const { container } = render(<ChunkingNavigator topic="Vendas" />);
    expect(container).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<ChunkingNavigator />);
    expect(container).toBeTruthy();
  });

  it('shows level descriptions', () => {
    render(<ChunkingNavigator />);
    expect(screen.getByText(/conceitos mais amplos/)).toBeInTheDocument();
  });
});
