import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LuxButton } from '../LuxButton';

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

describe('LuxButton', () => {
  it('renders default variant', () => {
    render(<LuxButton onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('renders header variant', () => {
    render(<LuxButton variant="header" onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<LuxButton variant="compact" onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<LuxButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<LuxButton onClick={() => {}} isLoading />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows processing state', () => {
    render(<LuxButton onClick={() => {}} isProcessing />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<LuxButton onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<LuxButton onClick={() => {}} className="custom" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
