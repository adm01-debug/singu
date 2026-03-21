import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, style, ...props }: any) => {
      const Tag = tag as any;
      return <Tag data-testid="scroll-bar" style={style} {...props}>{children}</Tag>;
    },
  }),
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useSpring: () => ({ get: () => 0 }),
}));

import { ScrollProgressBar } from '../ScrollProgressBar';

describe('ScrollProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScrollProgressBar />);
    expect(container).toBeTruthy();
  });

  it('renders a div element', () => {
    const { container } = render(<ScrollProgressBar />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('has fixed positioning class', () => {
    render(<ScrollProgressBar />);
    const bar = document.querySelector('[data-testid="scroll-bar"]');
    expect(bar).toBeTruthy();
    expect(bar?.className).toContain('fixed');
  });

  it('has top-0 positioning', () => {
    render(<ScrollProgressBar />);
    const bar = document.querySelector('[data-testid="scroll-bar"]');
    expect(bar?.className).toContain('top-0');
  });

  it('has gradient background class', () => {
    render(<ScrollProgressBar />);
    const bar = document.querySelector('[data-testid="scroll-bar"]');
    expect(bar?.className).toContain('gradient');
  });

  it('has z-50 class for proper stacking', () => {
    render(<ScrollProgressBar />);
    const bar = document.querySelector('[data-testid="scroll-bar"]');
    expect(bar?.className).toContain('z-50');
  });

  it('has small height', () => {
    render(<ScrollProgressBar />);
    const bar = document.querySelector('[data-testid="scroll-bar"]');
    expect(bar?.className).toContain('h-0.5');
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<ScrollProgressBar />);
    expect(() => rerender(<ScrollProgressBar />)).not.toThrow();
  });
});
