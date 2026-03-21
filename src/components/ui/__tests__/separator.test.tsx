import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders with separator role', () => {
    render(<Separator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('defaults to horizontal orientation', () => {
    render(<Separator />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders with vertical orientation', () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('applies horizontal classes', () => {
    render(<Separator />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveClass('h-[1px]', 'w-full');
  });

  it('applies vertical classes', () => {
    render(<Separator orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveClass('h-full', 'w-[1px]');
  });

  it('merges custom className', () => {
    render(<Separator className="my-sep" />);
    expect(screen.getByRole('separator')).toHaveClass('my-sep');
  });

  it('supports decorative prop', () => {
    render(<Separator decorative />);
    expect(screen.getByRole('none')).toBeInTheDocument();
  });
});
