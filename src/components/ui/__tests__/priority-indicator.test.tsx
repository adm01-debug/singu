import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PriorityIndicator, PriorityBar } from '../priority-indicator';

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

describe('PriorityIndicator', () => {
  it('renders with high score and recent interaction', () => {
    const { container } = render(
      <PriorityIndicator relationshipScore={90} lastInteractionDate={new Date().toISOString()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with low score', () => {
    const { container } = render(
      <PriorityIndicator relationshipScore={10} lastInteractionDate={null} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with no interaction date', () => {
    const { container } = render(
      <PriorityIndicator relationshipScore={50} lastInteractionDate={null} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with old interaction date', () => {
    const oldDate = new Date('2020-01-01').toISOString();
    const { container } = render(
      <PriorityIndicator relationshipScore={50} lastInteractionDate={oldDate} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PriorityIndicator relationshipScore={50} lastInteractionDate={null} className="custom" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('PriorityBar', () => {
  it('renders priority bar', () => {
    const { container } = render(
      <PriorityBar relationshipScore={70} lastInteractionDate={new Date().toISOString()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with no interaction', () => {
    const { container } = render(
      <PriorityBar relationshipScore={30} lastInteractionDate={null} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PriorityBar relationshipScore={50} lastInteractionDate={null} className="my-bar" />
    );
    expect(container.firstChild).toHaveClass('my-bar');
  });
});
