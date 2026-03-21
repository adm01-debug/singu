import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders with role alert', () => {
    render(<Alert>Alert content</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Alert>Message</Alert>);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Alert>Default</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('bg-background');
  });

  it('applies destructive variant', () => {
    render(<Alert variant="destructive">Error</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('border-destructive/50');
  });

  it('merges custom className', () => {
    render(<Alert className="my-alert">Custom</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('my-alert');
  });
});

describe('AlertTitle', () => {
  it('renders title text', () => {
    render(<AlertTitle>Warning</AlertTitle>);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('applies heading styles', () => {
    const { container } = render(<AlertTitle>Title</AlertTitle>);
    expect(container.firstChild).toHaveClass('font-medium');
  });
});

describe('AlertDescription', () => {
  it('renders description text', () => {
    render(<AlertDescription>Details</AlertDescription>);
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('applies text-sm class', () => {
    const { container } = render(<AlertDescription>Desc</AlertDescription>);
    expect(container.firstChild).toHaveClass('text-sm');
  });
});

describe('Alert composition', () => {
  it('renders complete alert', () => {
    render(
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders destructive alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Critical</AlertTitle>
        <AlertDescription>Action required.</AlertDescription>
      </Alert>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive/50');
  });
});
