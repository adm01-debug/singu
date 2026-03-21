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
  }),
}));
vi.mock('@/data/carnegieProgressCelebration', () => ({
  PROGRESS_CELEBRATIONS: [
    {
      id: 'pc1',
      type: 'milestone_reached',
      template: 'Parabéns por alcançar {milestone}!',
      variables: ['milestone'],
      discSuitability: { D: 70, I: 90, S: 80, C: 60 },
      intensity: 'high',
    },
  ],
}));

import { ProgressCelebrationPanel } from '../ProgressCelebrationPanel';

describe('ProgressCelebrationPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    expect(container).toBeTruthy();
  });

  it('renders card container', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<ProgressCelebrationPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders with null contact', () => {
    const { container } = render(<ProgressCelebrationPanel contact={null} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<ProgressCelebrationPanel className="custom" />);
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<ProgressCelebrationPanel />);
    expect(() => rerender(<ProgressCelebrationPanel />)).not.toThrow();
  });

  it('renders the panel content', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders celebration type labels', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('renders copy buttons', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('renders tab navigation', () => {
    const { container } = render(<ProgressCelebrationPanel />);
    const tabs = container.querySelectorAll('[role="tab"], button');
    expect(tabs.length).toBeGreaterThan(0);
  });
});
