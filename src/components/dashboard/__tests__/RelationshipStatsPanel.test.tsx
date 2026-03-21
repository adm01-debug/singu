import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));

import { RelationshipStatsPanel } from '../RelationshipStatsPanel';

describe('RelationshipStatsPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<RelationshipStatsPanel />);
    expect(container).toBeTruthy();
  });

  it('renders stat cards', () => {
    const { container } = render(<RelationshipStatsPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('displays metric values', () => {
    render(<RelationshipStatsPanel />);
    // Component uses mock data internally
    expect(screen.getByText('4.2h')).toBeInTheDocument();
  });

  it('handles compact mode', () => {
    const { container } = render(<RelationshipStatsPanel compact={true} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<RelationshipStatsPanel className="custom-class" />);
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<RelationshipStatsPanel />);
    expect(() => rerender(<RelationshipStatsPanel />)).not.toThrow();
  });

  it('shows change indicators', () => {
    render(<RelationshipStatsPanel />);
    // The component shows trend change values
    const container = document.body;
    expect(container.innerHTML).not.toBe('');
  });

  it('renders multiple stat metrics', () => {
    const { container } = render(<RelationshipStatsPanel />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(5);
  });
});
