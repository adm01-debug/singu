import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, SearchEmptyState } from '../empty-state';

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

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="Empty" description="Nothing to show" />);
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('renders actions', () => {
    render(
      <EmptyState
        title="Empty"
        actions={<button>Add Item</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('renders contacts illustration', () => {
    const { container } = render(<EmptyState title="No contacts" illustration="contacts" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders companies illustration', () => {
    const { container } = render(<EmptyState title="No companies" illustration="companies" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders search illustration', () => {
    const { container } = render(<EmptyState title="No results" illustration="search" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders tips if provided', () => {
    render(
      <EmptyState
        title="Empty"
        tips={['Tip 1', 'Tip 2']}
      />
    );
    expect(screen.getByText('Tip 1')).toBeInTheDocument();
    expect(screen.getByText('Tip 2')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    const Icon = () => <svg data-testid="custom-icon" />;
    render(<EmptyState title="Empty" icon={Icon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

describe('SearchEmptyState', () => {
  it('renders with search query', () => {
    render(<SearchEmptyState query="test" />);
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  it('renders clear button and calls onClear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SearchEmptyState query="abc" onClear={onClear} />);
    const clearBtn = screen.getByRole('button', { name: /limpar/i });
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
