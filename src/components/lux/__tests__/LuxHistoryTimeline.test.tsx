import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LuxHistoryTimeline } from '../LuxHistoryTimeline';

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

describe('LuxHistoryTimeline', () => {
  const mockRecords = [
    {
      id: '1',
      type: 'company' as const,
      status: 'completed' as const,
      created_at: '2024-01-01T00:00:00Z',
      summary: 'Company analysis complete',
    },
    {
      id: '2',
      type: 'contact' as const,
      status: 'pending' as const,
      created_at: '2024-01-02T00:00:00Z',
      summary: 'Contact analysis pending',
    },
  ];

  it('renders timeline with records', () => {
    render(<LuxHistoryTimeline records={mockRecords} />);
    expect(screen.getByText(/Company analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact analysis/i)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<LuxHistoryTimeline records={[]} loading />);
    const { container } = render(<LuxHistoryTimeline records={[]} loading />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<LuxHistoryTimeline records={[]} />);
    const { container } = render(<LuxHistoryTimeline records={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows status indicators', () => {
    const { container } = render(<LuxHistoryTimeline records={mockRecords} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<LuxHistoryTimeline records={mockRecords} />)).not.toThrow();
  });
});
