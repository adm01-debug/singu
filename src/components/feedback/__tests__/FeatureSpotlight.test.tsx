import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureSpotlight } from '../FeatureSpotlight';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@/hooks/useFeatureDiscovery', () => ({
  useFeatureDiscovery: () => ({
    hasSeenFeature: vi.fn().mockReturnValue(false),
    markAsSeen: vi.fn(),
  }),
}));
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('FeatureSpotlight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children immediately', () => {
    render(
      <FeatureSpotlight featureId="test" title="New Feature" description="Description">
        <button>My Button</button>
      </FeatureSpotlight>
    );
    expect(screen.getByText('My Button')).toBeInTheDocument();
  });

  it('does not show spotlight immediately', () => {
    render(
      <FeatureSpotlight featureId="test" title="New Feature" description="Description">
        <button>Button</button>
      </FeatureSpotlight>
    );
    expect(screen.queryByText('New Feature')).not.toBeInTheDocument();
  });

  it('shows spotlight after delay', () => {
    render(
      <FeatureSpotlight featureId="test" title="New Feature" description="Description" delay={1000}>
        <button>Button</button>
      </FeatureSpotlight>
    );
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('New Feature')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders Entendi dismiss button after delay', () => {
    render(
      <FeatureSpotlight featureId="test" title="Feature" description="Desc" delay={0}>
        <button>Button</button>
      </FeatureSpotlight>
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Entendi!')).toBeInTheDocument();
  });

  it('hides spotlight when dismiss is clicked', () => {
    render(
      <FeatureSpotlight featureId="test" title="Feature" description="Desc" delay={0}>
        <button>Button</button>
      </FeatureSpotlight>
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByText('Entendi!'));
    expect(screen.queryByText('Feature')).not.toBeInTheDocument();
  });

  it('does not show spotlight for already seen features', () => {
    const { useFeatureDiscovery } = vi.mocked(await import('@/hooks/useFeatureDiscovery'));
    vi.mocked(useFeatureDiscovery).mockReturnValue({
      hasSeenFeature: vi.fn().mockReturnValue(true),
      markAsSeen: vi.fn(),
    });

    render(
      <FeatureSpotlight featureId="seen-feature" title="Feature" description="Desc" delay={0}>
        <button>Button</button>
      </FeatureSpotlight>
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText('Feature')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FeatureSpotlight featureId="test" title="Feature" description="Desc" className="custom-class">
        <button>Button</button>
      </FeatureSpotlight>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders close X button after delay', () => {
    render(
      <FeatureSpotlight featureId="test" title="Feature" description="Desc" delay={0}>
        <button>Button</button>
      </FeatureSpotlight>
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Should have both X button and Entendi button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
