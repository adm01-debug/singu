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

vi.mock('react-force-graph-2d', () => ({
  default: (props: any) => <div data-testid="force-graph" />,
}));

import { StakeholderInfluenceNetwork } from '../StakeholderInfluenceNetwork';

describe('StakeholderInfluenceNetwork', () => {
  const defaultProps = {
    stakeholders: [
      { id: '1', name: 'Alice', power: 80, interest: 60, influence: 'high' as const },
      { id: '2', name: 'Bob', power: 30, interest: 90, influence: 'medium' as const },
    ],
  };

  it('renders the network component', () => {
    const { container } = render(<StakeholderInfluenceNetwork {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the force graph', () => {
    render(<StakeholderInfluenceNetwork {...defaultProps} />);
    expect(screen.getByTestId('force-graph')).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(<StakeholderInfluenceNetwork {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders without errors', () => {
    expect(() => render(<StakeholderInfluenceNetwork {...defaultProps} />)).not.toThrow();
  });

  it('renders with empty stakeholders', () => {
    const { container } = render(<StakeholderInfluenceNetwork stakeholders={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
