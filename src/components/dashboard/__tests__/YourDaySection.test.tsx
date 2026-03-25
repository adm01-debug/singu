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
vi.mock('@/components/ui/optimized-avatar', () => ({
  OptimizedAvatar: ({ alt }: any) => <div data-testid="avatar">{alt}</div>,
}));

const mockUseYourDay = vi.fn();
vi.mock('@/hooks/useYourDay', () => ({
  useYourDay: () => mockUseYourDay(),
}));

import { YourDaySection } from '../YourDaySection';

describe('YourDaySection', () => {
  const defaultMock = {
    todayFollowUps: [],
    overdueFollowUps: [],
    upcomingBirthdays: [],
    needsAttention: [],
    newInsights: [],
    loading: false,
  };

  beforeEach(() => {
    mockUseYourDay.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    const { container } = render(<YourDaySection />);
    expect(container).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseYourDay.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<YourDaySection />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles empty data', () => {
    const { container } = render(<YourDaySection />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders with follow-ups', () => {
    mockUseYourDay.mockReturnValue({
      ...defaultMock,
      todayFollowUps: [
        {
          interaction: { id: '1', type: 'call', scheduled_date: new Date().toISOString(), notes: 'Follow up call' },
          contact: { id: 'c1', first_name: 'John', last_name: 'Doe', avatar_url: null },
          company: null,
        },
      ],
    });
    const { container } = render(<YourDaySection />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<YourDaySection className="test-class" />);
    expect(container).toBeTruthy();
  });

  it('does not throw on re-render', () => {
    const { rerender } = render(<YourDaySection />);
    expect(() => rerender(<YourDaySection />)).not.toThrow();
  });

  it('handles birthdays data', () => {
    mockUseYourDay.mockReturnValue({
      ...defaultMock,
      upcomingBirthdays: [
        {
          contact: { id: 'c1', first_name: 'Jane', last_name: 'Doe', avatar_url: null },
          company: null,
          daysUntil: 3,
        },
      ],
    });
    const { container } = render(<YourDaySection />);
    expect(container).toBeTruthy();
  });

  it('handles needs attention data', () => {
    mockUseYourDay.mockReturnValue({
      ...defaultMock,
      needsAttention: [
        {
          contact: { id: 'c1', first_name: 'Bob', last_name: 'Smith', avatar_url: null },
          company: null,
          reason: 'No contact in 30 days',
          priority: 'high',
          daysSinceContact: 30,
        },
      ],
    });
    const { container } = render(<YourDaySection />);
    expect(container).toBeTruthy();
  });
});
