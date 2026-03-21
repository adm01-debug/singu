import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, BadgeGroup, StatusBadge, NotificationBadge } from '../badge';

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

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('applies secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.firstChild).toHaveClass('bg-secondary');
  });

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('renders with icon', () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Badge icon={<Icon />}>With Icon</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('renders dot indicator', () => {
    const { container } = render(<Badge dot>Dot Badge</Badge>);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renders closeable badge and fires onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Badge closeable onClose={onClose}>Closeable</Badge>);
    const closeBtn = screen.getByRole('button');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('merges custom className', () => {
    const { container } = render(<Badge className="custom">Test</Badge>);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('StatusBadge', () => {
  it('renders online status', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders offline status', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders away status', () => {
    render(<StatusBadge status="away" />);
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('renders busy status', () => {
    render(<StatusBadge status="busy" />);
    expect(screen.getByText('Ocupado')).toBeInTheDocument();
  });
});

describe('BadgeGroup', () => {
  it('renders all badges when count is within max', () => {
    render(
      <BadgeGroup max={5}>
        <Badge>A</Badge>
        <Badge>B</Badge>
        <Badge>C</Badge>
      </BadgeGroup>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('truncates badges when exceeding max', () => {
    render(
      <BadgeGroup max={2}>
        <Badge>A</Badge>
        <Badge>B</Badge>
        <Badge>C</Badge>
      </BadgeGroup>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});

describe('NotificationBadge', () => {
  it('renders count', () => {
    render(<NotificationBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows max+ when exceeding max', () => {
    render(<NotificationBadge count={100} max={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });
});
