import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition, MorphingNumber, SuccessCheckmark, Shimmer, PulseRing } from '../PageTransition';

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

describe('PageTransition', () => {
  it('renders children', () => {
    render(<PageTransition><div>Page content</div></PageTransition>);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('wraps children in a div', () => {
    const { container } = render(<PageTransition><span>Test</span></PageTransition>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});

describe('MorphingNumber (PageTransition)', () => {
  it('renders formatted value', () => {
    render(<MorphingNumber value={1234} />);
    expect(screen.getByText(/1.*234/)).toBeInTheDocument();
  });

  it('renders with custom format', () => {
    render(<MorphingNumber value={50} format={(v) => `${v}%`} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MorphingNumber value={10} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('SuccessCheckmark (PageTransition)', () => {
  it('renders when show is true', () => {
    const { container } = render(<SuccessCheckmark show />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<SuccessCheckmark show={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container } = render(<SuccessCheckmark show size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Shimmer', () => {
  it('renders children', () => {
    render(<Shimmer><span>Loading...</span></Shimmer>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Shimmer className="w-full h-8" />);
    expect(container.firstChild).toHaveClass('w-full', 'h-8');
  });
});

describe('PulseRing', () => {
  it('renders when show is true', () => {
    const { container } = render(<PulseRing show />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<PulseRing show={false} />);
    expect(container.firstChild).toBeNull();
  });
});
