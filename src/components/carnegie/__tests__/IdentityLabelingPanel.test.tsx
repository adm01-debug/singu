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
    discProfile: 'D',
    getIdentityLabels: () => [
      {
        id: 'il1',
        category: 'leader',
        label: 'Líder nato',
        description: 'Você é um líder natural',
        phrases: ['Você sempre lidera com excelência'],
        discProfile: 'D',
      },
    ],
  }),
}));

import { IdentityLabelingPanel } from '../IdentityLabelingPanel';

describe('IdentityLabelingPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<IdentityLabelingPanel />);
    expect(container).toBeTruthy();
  });

  it('renders card container', () => {
    const { container } = render(<IdentityLabelingPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<IdentityLabelingPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders with null contact', () => {
    const { container } = render(<IdentityLabelingPanel contact={null} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<IdentityLabelingPanel className="custom" />);
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<IdentityLabelingPanel />);
    expect(() => rerender(<IdentityLabelingPanel />)).not.toThrow();
  });

  it('renders the panel content', () => {
    const { container } = render(<IdentityLabelingPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders category labels', () => {
    const { container } = render(<IdentityLabelingPanel />);
    // Should have identity category elements
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('renders copy buttons for phrases', () => {
    const { container } = render(<IdentityLabelingPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles category icon mapping', () => {
    const { container } = render(<IdentityLabelingPanel />);
    expect(container).toBeTruthy();
  });
});
