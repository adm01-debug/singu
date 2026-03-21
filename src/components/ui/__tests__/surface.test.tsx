import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Surface } from '../surface';

describe('Surface', () => {
  it('renders children', () => {
    render(<Surface>Content</Surface>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with level 0', () => {
    const { container } = render(<Surface level={0}>L0</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with level 1', () => {
    const { container } = render(<Surface level={1}>L1</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with level 2', () => {
    const { container } = render(<Surface level={2}>L2</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with level 3', () => {
    const { container } = render(<Surface level={3}>L3</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with level 4', () => {
    const { container } = render(<Surface level={4}>L4</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies bordered prop', () => {
    const { container } = render(<Surface bordered>Bordered</Surface>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('applies rounded prop', () => {
    const { container } = render(<Surface rounded="lg">Rounded</Surface>);
    expect(container.firstChild).toHaveClass('rounded-lg');
  });

  it('applies hoverable prop', () => {
    const { container } = render(<Surface hoverable>Hoverable</Surface>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders as custom element', () => {
    render(<Surface as="section">Section</Surface>);
    expect(screen.getByText('Section').tagName).toBe('SECTION');
  });

  it('merges custom className', () => {
    const { container } = render(<Surface className="my-surface">Test</Surface>);
    expect(container.firstChild).toHaveClass('my-surface');
  });
});
