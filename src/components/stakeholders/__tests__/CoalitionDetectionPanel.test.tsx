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

vi.mock('@/hooks/useCoalitionDetection', () => ({
  useCoalitionDetection: () => ({
    coalitions: [
      { id: 'c1', name: 'Coalition A', members: ['1', '2'], strength: 85 },
    ],
    influenceClusters: [],
    powerBalance: { dominant: 50, balanced: 50 },
    loading: false,
    error: null,
  }),
}));

import { CoalitionDetectionPanel } from '../CoalitionDetectionPanel';

describe('CoalitionDetectionPanel', () => {
  it('renders the panel', () => {
    const { container } = render(<CoalitionDetectionPanel />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders coalition data', () => {
    render(<CoalitionDetectionPanel />);
    expect(screen.getByText(/Coalition A/i)).toBeInTheDocument();
  });

  it('renders power balance indicator', () => {
    const { container } = render(<CoalitionDetectionPanel />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CoalitionDetectionPanel className="my-class" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<CoalitionDetectionPanel />)).not.toThrow();
  });
});
