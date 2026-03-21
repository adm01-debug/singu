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

import AnchorTrackingSystem from '../AnchorTrackingSystem';

describe('AnchorTrackingSystem', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText('Anchor Tracking System')).toBeInTheDocument();
  });

  it('shows positive anchors section', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText(/Âncoras Positivas/)).toBeInTheDocument();
  });

  it('shows negative anchors section', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText(/Âncoras Negativas/)).toBeInTheDocument();
  });

  it('shows add anchor button', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText('Adicionar Âncora')).toBeInTheDocument();
  });

  it('shows add form when button is clicked', () => {
    render(<AnchorTrackingSystem />);
    fireEvent.click(screen.getByText('Adicionar Âncora'));
    expect(screen.getByText('Positiva')).toBeInTheDocument();
    expect(screen.getByText('Negativa')).toBeInTheDocument();
  });

  it('shows save anchor button in form', () => {
    render(<AnchorTrackingSystem />);
    fireEvent.click(screen.getByText('Adicionar Âncora'));
    expect(screen.getByText('Salvar Âncora')).toBeInTheDocument();
  });

  it('shows suggestion buttons when no positive anchors', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText('Mencionar família')).toBeInTheDocument();
  });

  it('shows negative suggestion buttons', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText('Pressão de tempo')).toBeInTheDocument();
  });

  it('adds anchor from suggestion', () => {
    const onChange = vi.fn();
    render(<AnchorTrackingSystem onAnchorsChange={onChange} />);
    fireEvent.click(screen.getByText('Mencionar família'));
    expect(onChange).toHaveBeenCalled();
  });

  it('accepts className prop', () => {
    const { container } = render(<AnchorTrackingSystem className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('displays positive and negative badges with counts', () => {
    render(<AnchorTrackingSystem />);
    const badges = screen.getAllByText('0');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows contact name in description', () => {
    render(<AnchorTrackingSystem />);
    expect(screen.getByText(/Cliente/)).toBeInTheDocument();
  });
});
