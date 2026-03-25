import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

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

import {
  ContactsPageSkeleton,
  CompaniesPageSkeleton,
  InteractionsPageSkeleton,
} from '../PageSkeletons';

describe('ContactsPageSkeleton', () => {
  it('renders the skeleton', () => {
    const { container } = render(<ContactsPageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<ContactsPageSkeleton />)).not.toThrow();
  });
});

describe('CompaniesPageSkeleton', () => {
  it('renders the skeleton', () => {
    const { container } = render(<CompaniesPageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<CompaniesPageSkeleton />)).not.toThrow();
  });
});

describe('InteractionsPageSkeleton', () => {
  it('renders the skeleton', () => {
    const { container } = render(<InteractionsPageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<InteractionsPageSkeleton />)).not.toThrow();
  });
});
