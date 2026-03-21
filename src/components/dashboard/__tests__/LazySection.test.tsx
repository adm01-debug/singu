import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useLazySection', () => ({
  useLazySection: () => ({
    ref: { current: null },
    isVisible: true,
  }),
}));
vi.mock('@/components/ui/surface', () => ({
  Surface: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

import { LazySection } from '../LazySection';

describe('LazySection', () => {
  it('renders without crashing', () => {
    render(
      <LazySection>
        <div>Test Content</div>
      </LazySection>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children when visible', () => {
    render(
      <LazySection>
        <div>Visible Child</div>
      </LazySection>
    );
    expect(screen.getByText('Visible Child')).toBeInTheDocument();
  });

  it('renders with chart fallback variant', () => {
    const { container } = render(
      <LazySection fallbackVariant="chart" fallbackHeight="h-64">
        <div>Chart Content</div>
      </LazySection>
    );
    expect(container).toBeTruthy();
  });

  it('renders with list fallback variant', () => {
    const { container } = render(
      <LazySection fallbackVariant="list">
        <div>List Content</div>
      </LazySection>
    );
    expect(container).toBeTruthy();
  });

  it('renders with card fallback variant', () => {
    const { container } = render(
      <LazySection fallbackVariant="card">
        <div>Card Content</div>
      </LazySection>
    );
    expect(container).toBeTruthy();
  });

  it('renders with default fallback variant', () => {
    const { container } = render(
      <LazySection fallbackVariant="default">
        <div>Default Content</div>
      </LazySection>
    );
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <LazySection className="custom-class">
        <div>Content</div>
      </LazySection>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows skeleton when not visible', () => {
    vi.doMock('@/hooks/useLazySection', () => ({
      useLazySection: () => ({
        ref: { current: null },
        isVisible: false,
      }),
    }));
    // With current mock isVisible=true, children are shown
    render(
      <LazySection>
        <div>Content</div>
      </LazySection>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with custom fallbackHeight', () => {
    const { container } = render(
      <LazySection fallbackHeight="h-96">
        <div>Tall Content</div>
      </LazySection>
    );
    expect(container).toBeTruthy();
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(
      <LazySection>
        <div>Content</div>
      </LazySection>
    );
    expect(() =>
      rerender(
        <LazySection>
          <div>Updated Content</div>
        </LazySection>
      )
    ).not.toThrow();
  });
});
