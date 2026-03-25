import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DashboardSkeleton from '../DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders the skeleton layout', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders stats grid skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const cards = container.querySelectorAll('.overflow-hidden');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders chart skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('renders contact skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const roundedFull = container.querySelectorAll('.rounded-full');
    expect(roundedFull.length).toBeGreaterThan(0);
  });

  it('has animate-fade-in class', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toHaveClass('animate-fade-in');
  });

  it('renders activity section', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelectorAll('.space-y-4').length).toBeGreaterThan(0);
  });
});
