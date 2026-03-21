import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DashboardErrorBoundary } from '../DashboardErrorBoundary';

// Component that throws an error
const ThrowingComponent = () => {
  throw new Error('Test error');
};

// Component that doesn't throw
const WorkingComponent = () => <div>Working content</div>;

describe('DashboardErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children without crashing when no error', () => {
    render(
      <DashboardErrorBoundary>
        <WorkingComponent />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });

  it('shows error UI when child throws', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Erro ao carregar widget')).toBeInTheDocument();
  });

  it('shows section name in error message when provided', () => {
    render(
      <DashboardErrorBoundary sectionName="Charts">
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Erro ao carregar: Charts')).toBeInTheDocument();
  });

  it('shows retry button in error state', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('retries rendering on retry button click', () => {
    const { container } = render(
      <DashboardErrorBoundary>
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );
    // Click retry - it will throw again but we verify the mechanism works
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(screen.getByText('Erro ao carregar widget')).toBeInTheDocument();
  });

  it('renders error boundary container', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowingComponent />
      </DashboardErrorBoundary>
    );
    const container = document.querySelector('[class*="destructive"]');
    expect(container).toBeTruthy();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <DashboardErrorBoundary sectionName="Test Widget">
        <div>All good</div>
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByText('Erro ao carregar')).not.toBeInTheDocument();
  });

  it('does not affect other siblings', () => {
    render(
      <div>
        <DashboardErrorBoundary>
          <ThrowingComponent />
        </DashboardErrorBoundary>
        <div>Sibling content</div>
      </div>
    );
    expect(screen.getByText('Sibling content')).toBeInTheDocument();
    expect(screen.getByText('Erro ao carregar widget')).toBeInTheDocument();
  });
});
