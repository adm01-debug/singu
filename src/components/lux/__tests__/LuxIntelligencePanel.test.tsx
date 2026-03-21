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

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/hooks/useLuxIntelligence', () => ({
  useLuxIntelligence: () => ({
    intelligence: null,
    loading: false,
    error: null,
    fetchIntelligence: vi.fn(),
  }),
}));

import { LuxIntelligencePanel } from '../LuxIntelligencePanel';

describe('LuxIntelligencePanel', () => {
  it('renders the panel', () => {
    const { container } = render(<LuxIntelligencePanel entityType="company" entityId="123" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders for company entity type', () => {
    const { container } = render(<LuxIntelligencePanel entityType="company" entityId="123" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders for contact entity type', () => {
    const { container } = render(<LuxIntelligencePanel entityType="contact" entityId="456" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<LuxIntelligencePanel entityType="company" entityId="123" />)).not.toThrow();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LuxIntelligencePanel entityType="company" entityId="123" className="custom" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
