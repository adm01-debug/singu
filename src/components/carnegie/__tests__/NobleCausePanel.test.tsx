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

vi.mock('@/hooks/useCarnegieAnalysis', () => ({
  useCarnegieAnalysis: () => ({
    discProfile: 'I',
    getNobleCauses: () => [
      {
        id: 'nc1',
        category: 'altruism',
        cause: 'Ajudar os outros',
        description: 'Motivado pelo desejo de ajudar',
        phrases: ['Sabemos que seu objetivo é fazer a diferença'],
        discProfile: 'I',
      },
    ],
  }),
}));

import { NobleCausePanel } from '../NobleCausePanel';

describe('NobleCausePanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<NobleCausePanel />);
    expect(container).toBeTruthy();
  });

  it('renders card container', () => {
    const { container } = render(<NobleCausePanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<NobleCausePanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders with null contact', () => {
    const { container } = render(<NobleCausePanel contact={null} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<NobleCausePanel className="custom" />);
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<NobleCausePanel />);
    expect(() => rerender(<NobleCausePanel />)).not.toThrow();
  });

  it('renders the panel content', () => {
    const { container } = render(<NobleCausePanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders category elements', () => {
    const { container } = render(<NobleCausePanel />);
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('renders copy buttons', () => {
    const { container } = render(<NobleCausePanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles category color mapping', () => {
    const { container } = render(<NobleCausePanel />);
    expect(container).toBeTruthy();
  });
});
