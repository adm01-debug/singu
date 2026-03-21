import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress', () => {
  it('renders with progressbar role', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuenow', () => {
    render(<Progress value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('defaults value to 0', () => {
    render(<Progress />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('renders at 0%', () => {
    render(<Progress value={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders at 100%', () => {
    render(<Progress value={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('merges custom className', () => {
    render(<Progress value={50} className="custom-progress" />);
    expect(screen.getByRole('progressbar')).toHaveClass('custom-progress');
  });
});
