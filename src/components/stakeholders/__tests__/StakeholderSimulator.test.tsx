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

vi.mock('@/hooks/useStakeholderSimulator', () => ({
  useStakeholderSimulator: () => ({
    stakeholders: [
      { id: '1', name: 'Alice', power: 80, interest: 60 },
      { id: '2', name: 'Bob', power: 30, interest: 90 },
    ],
    selectedStakeholders: [],
    simulationResult: null,
    loading: false,
    selectStakeholder: vi.fn(),
    deselectStakeholder: vi.fn(),
    runSimulation: vi.fn(),
    resetSimulation: vi.fn(),
  }),
}));

import { StakeholderSimulator } from '../StakeholderSimulator';

describe('StakeholderSimulator', () => {
  it('renders the simulator', () => {
    const { container } = render(<StakeholderSimulator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders stakeholder names', () => {
    render(<StakeholderSimulator />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders simulation controls', () => {
    render(<StakeholderSimulator />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders without errors', () => {
    expect(() => render(<StakeholderSimulator />)).not.toThrow();
  });

  it('applies custom className', () => {
    const { container } = render(<StakeholderSimulator className="custom" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
