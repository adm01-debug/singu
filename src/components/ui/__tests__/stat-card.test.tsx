import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard, MiniStat, StatsRow, HeroStat } from '../stat-card';

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
  useSpring: () => ({ get: () => 0, set: () => {} }),
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => ({ get: () => 0 }),
}));

import { vi } from 'vitest';

describe('StatCard', () => {
  it('renders title', () => {
    render(<StatCard title="Revenue" value={1000} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<StatCard title="Count" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders change indicator positive', () => {
    render(<StatCard title="Growth" value={100} change={15} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('renders change indicator negative', () => {
    render(<StatCard title="Decline" value={50} change={-10} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const Icon = () => <svg data-testid="stat-icon" />;
    render(<StatCard title="Stat" value={10} icon={<Icon />} />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<StatCard title="Stat" value={5} description="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});

describe('MiniStat', () => {
  it('renders label and value', () => {
    render(<MiniStat label="Active" value={20} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});

describe('HeroStat', () => {
  it('renders title and value', () => {
    render(<HeroStat title="Total" value={9999} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
});
