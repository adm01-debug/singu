import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuccessCheckmark, ErrorXMark, LoadingDots, ProgressRing } from '../SuccessCheckmark';

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

describe('SuccessCheckmark', () => {
  it('renders when show is true', () => {
    const { container } = render(<SuccessCheckmark show />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<SuccessCheckmark show={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders with size sm', () => {
    const { container } = render(<SuccessCheckmark show size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(<SuccessCheckmark show size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size xl', () => {
    const { container } = render(<SuccessCheckmark show size="xl" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SuccessCheckmark show className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('ErrorXMark', () => {
  it('renders when show is true', () => {
    const { container } = render(<ErrorXMark show />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<ErrorXMark show={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders with size md', () => {
    const { container } = render(<ErrorXMark show size="md" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('LoadingDots', () => {
  it('renders three dots', () => {
    const { container } = render(<LoadingDots />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('renders with size sm', () => {
    const { container } = render(<LoadingDots size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(<LoadingDots size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ProgressRing', () => {
  it('renders svg element', () => {
    const { container } = render(<ProgressRing progress={50} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows value by default', () => {
    render(<ProgressRing progress={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides value when showValue is false', () => {
    const { container } = render(<ProgressRing progress={75} showValue={false} />);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container: sm } = render(<ProgressRing progress={50} size="sm" />);
    const { container: lg } = render(<ProgressRing progress={50} size="lg" />);
    expect(sm.querySelector('svg')).toBeInTheDocument();
    expect(lg.querySelector('svg')).toBeInTheDocument();
  });
});
