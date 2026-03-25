import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import MiniCelebration, { useMiniCelebration, CelebratoryAction } from '../MiniCelebration';

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

describe('MiniCelebration', () => {
  const defaultProps = {
    show: true,
    position: { x: 100, y: 200 },
    onComplete: vi.fn(),
  };

  it('renders when show is true', () => {
    const { container } = render(<MiniCelebration {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    const { container } = render(<MiniCelebration {...defaultProps} show={false} />);
    expect(container.querySelector('.fixed')).not.toBeInTheDocument();
  });

  it('does not render without position', () => {
    const { container } = render(<MiniCelebration show position={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with success variant', () => {
    const { container } = render(<MiniCelebration {...defaultProps} variant="success" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with star variant', () => {
    const { container } = render(<MiniCelebration {...defaultProps} variant="star" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<MiniCelebration {...defaultProps} message="Great job!" />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container: sm } = render(<MiniCelebration {...defaultProps} size="sm" />);
    const { container: lg } = render(<MiniCelebration {...defaultProps} size="lg" />);
    expect(sm.firstChild).toBeInTheDocument();
    expect(lg.firstChild).toBeInTheDocument();
  });
});

describe('useMiniCelebration', () => {
  it('initializes with show false', () => {
    const { result } = renderHook(() => useMiniCelebration());
    expect(result.current.show).toBe(false);
  });

  it('triggers celebration', () => {
    const { result } = renderHook(() => useMiniCelebration());
    act(() => {
      result.current.trigger({ clientX: 100, clientY: 200 }, { variant: 'star' });
    });
    expect(result.current.show).toBe(true);
  });

  it('resets celebration', () => {
    const { result } = renderHook(() => useMiniCelebration());
    act(() => {
      result.current.trigger({ clientX: 100, clientY: 200 });
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.show).toBe(false);
  });
});

describe('CelebratoryAction', () => {
  it('renders children', () => {
    render(<CelebratoryAction>Click me</CelebratoryAction>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelebratoryAction onClick={onClick}>Action</CelebratoryAction>);
    await user.click(screen.getByText('Action'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not trigger when disabled', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelebratoryAction onClick={onClick} disabled>Disabled</CelebratoryAction>);
    await user.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
