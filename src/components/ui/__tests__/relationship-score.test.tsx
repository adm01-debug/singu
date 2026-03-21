import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelationshipScore } from '../relationship-score';

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

describe('RelationshipScore', () => {
  it('renders score value', () => {
    render(<RelationshipScore score={75} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders with size sm', () => {
    const { container } = render(<RelationshipScore score={50} size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size md', () => {
    const { container } = render(<RelationshipScore score={50} size="md" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(<RelationshipScore score={50} size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies success color for high score (>=80)', () => {
    const { container } = render(<RelationshipScore score={85} />);
    expect(container.innerHTML).toContain('success');
  });

  it('applies primary color for medium-high score (>=60)', () => {
    const { container } = render(<RelationshipScore score={65} />);
    expect(container.innerHTML).toContain('primary');
  });

  it('applies warning color for medium score (>=40)', () => {
    const { container } = render(<RelationshipScore score={45} />);
    expect(container.innerHTML).toContain('warning');
  });

  it('applies destructive color for low score (<40)', () => {
    const { container } = render(<RelationshipScore score={20} />);
    expect(container.innerHTML).toContain('destructive');
  });

  it('renders score of 0', () => {
    render(<RelationshipScore score={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders score of 100', () => {
    render(<RelationshipScore score={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
