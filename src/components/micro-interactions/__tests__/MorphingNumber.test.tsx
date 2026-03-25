import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MorphingNumber, CompactNumber, ScoreIndicator } from '../MorphingNumber';

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
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    on: vi.fn(() => vi.fn()),
  }),
  useSpring: (motionValue: any) => ({
    get: () => 0,
    set: vi.fn(),
    on: vi.fn((event: string, cb: (v: number) => void) => {
      cb(0);
      return vi.fn();
    }),
  }),
  useTransform: () => ({ get: () => 0 }),
}));

describe('MorphingNumber', () => {
  it('renders the component', () => {
    const { container } = render(<MorphingNumber value={100} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with prefix', () => {
    const { container } = render(<MorphingNumber value={50} prefix="$" />);
    expect(container.textContent).toContain('$');
  });

  it('renders with suffix', () => {
    const { container } = render(<MorphingNumber value={50} suffix="%" />);
    expect(container.textContent).toContain('%');
  });

  it('applies custom className', () => {
    const { container } = render(<MorphingNumber value={10} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders with currency format', () => {
    const { container } = render(<MorphingNumber value={1000} formatAsCurrency />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with percentage format', () => {
    const { container } = render(<MorphingNumber value={85} formatAsPercentage />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('CompactNumber', () => {
  it('renders the component', () => {
    const { container } = render(<CompactNumber value={500} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with prefix and suffix', () => {
    const { container } = render(<CompactNumber value={100} prefix="~" suffix="+" />);
    expect(container.textContent).toContain('~');
    expect(container.textContent).toContain('+');
  });

  it('applies custom className', () => {
    const { container } = render(<CompactNumber value={50} className="compact" />);
    expect(container.firstChild).toHaveClass('compact');
  });
});

describe('ScoreIndicator', () => {
  it('renders the component', () => {
    const { container } = render(<ScoreIndicator score={75} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with maxScore', () => {
    const { container } = render(<ScoreIndicator score={50} maxScore={200} />);
    expect(container.textContent).toContain('200');
  });

  it('hides percentage when showPercentage is false', () => {
    const { container } = render(<ScoreIndicator score={50} showPercentage={false} />);
    expect(container.textContent).not.toContain('100');
  });

  it('renders with different sizes', () => {
    const { container: sm } = render(<ScoreIndicator score={50} size="sm" />);
    const { container: lg } = render(<ScoreIndicator score={50} size="lg" />);
    expect(sm.firstChild).toBeInTheDocument();
    expect(lg.firstChild).toBeInTheDocument();
  });
});
