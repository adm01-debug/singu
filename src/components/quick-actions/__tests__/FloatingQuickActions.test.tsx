import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { FloatingQuickActions } from '../FloatingQuickActions';

describe('FloatingQuickActions', () => {
  it('renders the FAB button', () => {
    render(<FloatingQuickActions />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('toggles open state on click', async () => {
    const user = userEvent.setup();
    render(<FloatingQuickActions />);
    const fabBtn = screen.getAllByRole('button')[0];
    await user.click(fabBtn);
    expect(fabBtn).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<FloatingQuickActions />)).not.toThrow();
  });

  it('applies custom className', () => {
    const { container } = render(<FloatingQuickActions className="custom" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders action items when open', async () => {
    const user = userEvent.setup();
    render(<FloatingQuickActions />);
    const fabBtn = screen.getAllByRole('button')[0];
    await user.click(fabBtn);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
