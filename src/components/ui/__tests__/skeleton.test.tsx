import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard, SkeletonTableRow, SkeletonInput } from '../skeleton';

describe('Skeleton', () => {
  it('renders a div element', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies animate-pulse by default (pulse variant)', () => {
    const { container } = render(<Skeleton variant="pulse" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies shimmer variant', () => {
    const { container } = render(<Skeleton variant="shimmer" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies rounded option', () => {
    const { container } = render(<Skeleton rounded="full" />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="w-32 h-8" />);
    expect(container.firstChild).toHaveClass('w-32', 'h-8');
  });
});

describe('SkeletonText', () => {
  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll('[class*="animate"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('SkeletonAvatar', () => {
  it('renders with rounded-full class', () => {
    const { container } = render(<SkeletonAvatar />);
    const el = container.querySelector('.rounded-full');
    expect(el).toBeInTheDocument();
  });
});

describe('SkeletonButton', () => {
  it('renders a button-shaped skeleton', () => {
    const { container } = render(<SkeletonButton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders a card skeleton layout', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonTableRow', () => {
  it('renders a table row skeleton', () => {
    const { container } = render(<SkeletonTableRow />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonInput', () => {
  it('renders an input skeleton', () => {
    const { container } = render(<SkeletonInput />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
