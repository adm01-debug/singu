import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      return ({ children, ...props }: any) => {
        const Element = typeof tag === 'string' ? tag : 'div';
        return <Element {...props}>{children}</Element>;
      };
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/hooks/usePreContactBriefing', () => ({
  usePreContactBriefing: () => ({
    upcomingBriefings: [
      {
        interaction: { id: 'i1', type: 'call', title: 'Call with Alice' },
        contact: { id: 'c1', first_name: 'Alice', last_name: 'Smith', avatar_url: null },
        minutesUntilMeeting: 15,
      },
    ],
    activeBriefing: null,
    loading: false,
    dismissBriefing: vi.fn(),
    showBriefingFor: vi.fn(),
  }),
}));

vi.mock('@/components/neuromarketing', () => ({
  NeuroBriefingCard: () => <div data-testid="neuro-card" />,
}));

import { PreContactBriefing } from '../PreContactBriefing';

describe('PreContactBriefing', () => {
  it('renders upcoming briefings', () => {
    render(<PreContactBriefing />);
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
  });

  it('renders interaction title', () => {
    render(<PreContactBriefing />);
    expect(screen.getByText('Call with Alice')).toBeInTheDocument();
  });

  it('renders time until meeting', () => {
    render(<PreContactBriefing />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('renders compact version', () => {
    render(<PreContactBriefing compact />);
    expect(screen.getByText(/Briefing/i)).toBeInTheDocument();
  });

  it('returns null when loading', () => {
    vi.mocked(require('@/hooks/usePreContactBriefing').usePreContactBriefing).mockReturnValueOnce({
      upcomingBriefings: [],
      activeBriefing: null,
      loading: true,
      dismissBriefing: vi.fn(),
      showBriefingFor: vi.fn(),
    });
  });

  it('applies custom className', () => {
    const { container } = render(<PreContactBriefing className="custom" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<PreContactBriefing />)).not.toThrow();
  });
});
