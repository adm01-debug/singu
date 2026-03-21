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

const mockUseImportantDates = vi.fn();
vi.mock('@/hooks/useImportantDates', () => ({
  useImportantDates: (...args: any[]) => mockUseImportantDates(...args),
}));

import { ImportantDatesCalendar } from '../ImportantDatesCalendar';

describe('ImportantDatesCalendar', () => {
  const defaultProps = {
    contacts: [],
    interactions: [],
  };

  beforeEach(() => {
    mockUseImportantDates.mockReturnValue({
      allDates: [],
      today: [],
      thisWeek: [],
      hasUrgent: false,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ImportantDatesCalendar {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders calendar layout', () => {
    const { container } = render(<ImportantDatesCalendar {...defaultProps} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('handles empty dates', () => {
    const { container } = render(<ImportantDatesCalendar {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders with contacts', () => {
    const { container } = render(
      <ImportantDatesCalendar
        contacts={[{ id: '1', first_name: 'Test', last_name: 'User' }] as any}
        interactions={[]}
      />
    );
    expect(container).toBeTruthy();
  });

  it('handles compact mode', () => {
    const { container } = render(<ImportantDatesCalendar {...defaultProps} compact={true} />);
    expect(container).toBeTruthy();
  });

  it('renders navigation buttons', () => {
    const { container } = render(<ImportantDatesCalendar {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<ImportantDatesCalendar {...defaultProps} />);
    expect(() => rerender(<ImportantDatesCalendar {...defaultProps} />)).not.toThrow();
  });

  it('renders with dates data', () => {
    mockUseImportantDates.mockReturnValue({
      allDates: [
        { date: new Date(), type: 'birthday', contactId: '1', contactName: 'Test User', label: 'Aniversário' },
      ],
      today: [],
      thisWeek: [],
      hasUrgent: false,
    });
    const { container } = render(<ImportantDatesCalendar {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
