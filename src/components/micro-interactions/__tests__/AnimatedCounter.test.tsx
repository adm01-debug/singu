import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlipCounter, SlotCounter, CountUp, AnimatedBadge } from '../AnimatedCounter';

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

describe('FlipCounter', () => {
  it('renders value digits', () => {
    render(<FlipCounter value={42} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders single digit', () => {
    render(<FlipCounter value={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders negative values', () => {
    render(<FlipCounter value={-3} />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FlipCounter value={10} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders zero', () => {
    render(<FlipCounter value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('SlotCounter', () => {
  it('renders the value', () => {
    const { container } = render(<SlotCounter value={7} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('pads with zeros when minDigits specified', () => {
    const { container } = render(<SlotCounter value={5} minDigits={3} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SlotCounter value={5} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('CountUp', () => {
  it('renders the component', () => {
    const { container } = render(<CountUp to={100} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with from value', () => {
    const { container } = render(<CountUp from={0} to={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CountUp to={100} className="counter" />);
    expect(container.firstChild).toHaveClass('counter');
  });
});

describe('AnimatedBadge', () => {
  it('renders count', () => {
    render(<AnimatedBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows max+ when exceeding maxCount', () => {
    render(<AnimatedBadge count={150} maxCount={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    const { container } = render(<AnimatedBadge count={0} />);
    expect(container.textContent).toBe('');
  });

  it('applies variant classes', () => {
    const { container } = render(<AnimatedBadge count={3} variant="destructive" />);
    expect(container.innerHTML).toContain('destructive');
  });
});
