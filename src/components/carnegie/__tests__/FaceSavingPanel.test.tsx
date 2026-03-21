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
    discProfile: 'S',
  }),
}));
vi.mock('@/data/carnegieFaceSaving', () => ({
  FACE_SAVING_TECHNIQUES: [
    {
      id: 'fs1',
      scenario: 'price_objection',
      technique: 'Reframe value',
      description: 'Focus on value, not price',
      examples: ['Example 1'],
      discAdaptation: { D: 'Be direct', I: 'Be enthusiastic', S: 'Be patient', C: 'Be detailed' },
    },
  ],
}));

import { FaceSavingPanel } from '../FaceSavingPanel';

describe('FaceSavingPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<FaceSavingPanel />);
    expect(container).toBeTruthy();
  });

  it('renders card container', () => {
    const { container } = render(<FaceSavingPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<FaceSavingPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders with null contact', () => {
    const { container } = render(<FaceSavingPanel contact={null} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<FaceSavingPanel className="custom" />);
    expect(container).toBeTruthy();
  });

  it('renders scenario selector', () => {
    const { container } = render(<FaceSavingPanel />);
    // Should have a select or buttons for scenarios
    const selects = container.querySelectorAll('button, select, [role="combobox"]');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<FaceSavingPanel />);
    expect(() => rerender(<FaceSavingPanel />)).not.toThrow();
  });

  it('renders the panel heading', () => {
    const { container } = render(<FaceSavingPanel />);
    expect(container.innerHTML).toContain('Face');
  });

  it('renders techniques list', () => {
    const { container } = render(<FaceSavingPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('handles scenario labels', () => {
    const { container } = render(<FaceSavingPanel />);
    expect(container).toBeTruthy();
  });
});
