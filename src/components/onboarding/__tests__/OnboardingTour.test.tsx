import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { OnboardingTour, useOnboardingTour } from '../OnboardingTour';

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

describe('OnboardingTour', () => {
  const defaultProps = {
    isOpen: true,
    onComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  it('renders when isOpen is true', () => {
    render(<OnboardingTour {...defaultProps} />);
    expect(screen.getByText(/Bem-vindo/)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<OnboardingTour {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows step count', () => {
    render(<OnboardingTour {...defaultProps} />);
    expect(screen.getByText(/Passo 1/)).toBeInTheDocument();
  });

  it('renders next button', () => {
    render(<OnboardingTour {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Próximo/i })).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<OnboardingTour {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Pular/i })).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();
    render(<OnboardingTour {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    expect(screen.getByText(/Passo 2/)).toBeInTheDocument();
  });

  it('calls onSkip when skip clicked', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<OnboardingTour {...defaultProps} onSkip={onSkip} />);
    await user.click(screen.getByRole('button', { name: /Pular/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('renders progress bar', () => {
    render(<OnboardingTour {...defaultProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables previous button on first step', () => {
    render(<OnboardingTour {...defaultProps} />);
    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    expect(prevBtn).toBeDisabled();
  });
});

describe('useOnboardingTour', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with isOpen false', () => {
    const { result } = renderHook(() => useOnboardingTour('test'));
    expect(result.current.isOpen).toBe(false);
  });

  it('starts tour', () => {
    const { result } = renderHook(() => useOnboardingTour('test'));
    act(() => { result.current.startTour(); });
    expect(result.current.isOpen).toBe(true);
  });

  it('completes tour and persists', () => {
    const { result } = renderHook(() => useOnboardingTour('test'));
    act(() => { result.current.completeTour(); });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.hasCompleted).toBe(true);
    expect(localStorage.getItem('tour-completed-test')).toBe('true');
  });

  it('skips tour', () => {
    const { result } = renderHook(() => useOnboardingTour('test'));
    act(() => { result.current.skipTour(); });
    expect(result.current.hasCompleted).toBe(true);
  });

  it('resets tour', () => {
    const { result } = renderHook(() => useOnboardingTour('test'));
    act(() => { result.current.completeTour(); });
    act(() => { result.current.resetTour(); });
    expect(result.current.hasCompleted).toBe(false);
  });
});
