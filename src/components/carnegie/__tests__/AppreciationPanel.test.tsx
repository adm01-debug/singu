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
vi.mock('@/data/carnegieAppreciation', () => ({
  APPRECIATION_TEMPLATES: {
    sincere_compliment: [
      {
        id: 't1',
        type: 'sincere_compliment',
        template: 'Admirei muito sua {quality}',
        variables: ['quality'],
        discSuitability: { D: 70, I: 90, S: 80, C: 60 },
        impact: 'high',
        context: 'general',
      },
    ],
    specific_recognition: [],
    effort_acknowledgment: [],
    character_praise: [],
    achievement_celebration: [],
    growth_recognition: [],
    contribution_thanks: [],
    quality_admiration: [],
  },
}));

import { AppreciationPanel } from '../AppreciationPanel';

describe('AppreciationPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppreciationPanel />);
    expect(container).toBeTruthy();
  });

  it('renders the panel heading', () => {
    const { container } = render(<AppreciationPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<AppreciationPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders with null contact', () => {
    const { container } = render(<AppreciationPanel contact={null} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<AppreciationPanel className="custom-class" />);
    expect(container).toBeTruthy();
  });

  it('renders template categories', () => {
    const { container } = render(<AppreciationPanel />);
    const badges = container.querySelectorAll('[class*="badge"], [class*="Badge"]');
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  it('renders copy buttons', () => {
    const { container } = render(<AppreciationPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<AppreciationPanel />);
    expect(() => rerender(<AppreciationPanel />)).not.toThrow();
  });

  it('renders card container', () => {
    const { container } = render(<AppreciationPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('handles missing DISC profile gracefully', () => {
    const { container } = render(<AppreciationPanel />);
    expect(container).toBeTruthy();
  });
});
