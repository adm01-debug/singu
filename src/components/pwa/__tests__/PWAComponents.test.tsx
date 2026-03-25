import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
  OfflineIndicator,
  NetworkStatusBadge,
} from '../PWAComponents';

describe('OfflineIndicator', () => {
  it('renders without errors', () => {
    expect(() => render(<OfflineIndicator />)).not.toThrow();
  });

  it('renders the component', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeInTheDocument();
  });
});

describe('NetworkStatusBadge', () => {
  it('renders without errors', () => {
    expect(() => render(<NetworkStatusBadge />)).not.toThrow();
  });

  it('renders the component', () => {
    const { container } = render(<NetworkStatusBadge />);
    expect(container).toBeInTheDocument();
  });
});
