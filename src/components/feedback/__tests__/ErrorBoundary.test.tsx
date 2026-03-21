import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, WithErrorBoundary } from '../ErrorBoundary';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('@/lib/ux-messages', () => ({
  getErrorMessage: () => 'Algo inesperado aconteceu. Por favor, tente novamente.',
}));

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working Component</div>;
}

// Suppress console.error for error boundary tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
  });

  it('renders empathic error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo inesperado aconteceu. Por favor, tente novamente.')).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('renders go home button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Ir para o início')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('shows error details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('does not show error details by default', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
  });

  it('increments retry count on retry', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Tentar novamente'));
    // After retry, it will throw again and show retry count
    expect(screen.getByText(/Tentativa 1 de 3/)).toBeInTheDocument();
  });

  it('shows retry count after multiple retries', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Tentar novamente'));
    fireEvent.click(screen.getByText(/Tentar novamente/));
    expect(screen.getByText(/Tentativa 2 de 3/)).toBeInTheDocument();
  });
});

describe('WithErrorBoundary', () => {
  it('renders children normally', () => {
    render(
      <WithErrorBoundary>
        <div>Content</div>
      </WithErrorBoundary>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('catches errors from children', () => {
    render(
      <WithErrorBoundary>
        <ThrowingComponent />
      </WithErrorBoundary>
    );
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
  });
});
