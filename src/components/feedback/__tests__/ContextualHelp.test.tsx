import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextualHelp, InlineHelp, FeatureHighlight } from '../ContextualHelp';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('ContextualHelp', () => {
  it('renders help icon trigger', () => {
    render(<ContextualHelp title="Help Title" description="Help description" />);
    expect(screen.getByLabelText('Ajuda: Help Title')).toBeInTheDocument();
  });

  it('renders as tooltip by default', () => {
    render(<ContextualHelp title="Help" description="Description" />);
    // Tooltip trigger should be present
    expect(screen.getByLabelText('Ajuda: Help')).toBeInTheDocument();
  });

  it('renders as popover when asPopover is true', () => {
    render(<ContextualHelp title="Help" description="Description" asPopover />);
    const trigger = screen.getByLabelText('Ajuda: Help');
    fireEvent.click(trigger);
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders learn more link when provided', () => {
    render(
      <ContextualHelp
        title="Help"
        description="Desc"
        learnMoreUrl="https://example.com"
        asPopover
      />
    );
    fireEvent.click(screen.getByLabelText('Ajuda: Help'));
    expect(screen.getByText('Saiba mais')).toBeInTheDocument();
  });

  it('does not render learn more link when not provided', () => {
    render(<ContextualHelp title="Help" description="Desc" asPopover />);
    fireEvent.click(screen.getByLabelText('Ajuda: Help'));
    expect(screen.queryByText('Saiba mais')).not.toBeInTheDocument();
  });

  it('renders custom trigger when provided', () => {
    render(
      <ContextualHelp
        title="Help"
        description="Desc"
        trigger={<button data-testid="custom-trigger">?</button>}
      />
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });

  it('renders children content in popover', () => {
    render(
      <ContextualHelp title="Help" description="Desc" asPopover>
        <span>Extra content</span>
      </ContextualHelp>
    );
    fireEvent.click(screen.getByLabelText('Ajuda: Help'));
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });

  it('renders close button in popover mode', () => {
    render(<ContextualHelp title="Help" description="Desc" asPopover />);
    fireEvent.click(screen.getByLabelText('Ajuda: Help'));
    // Close button (X icon button) should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('InlineHelp', () => {
  it('renders help text', () => {
    render(<InlineHelp>This is help text</InlineHelp>);
    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('renders as paragraph element', () => {
    render(<InlineHelp>Help text</InlineHelp>);
    const element = screen.getByText('Help text');
    expect(element.tagName).toBe('P');
  });

  it('applies custom className', () => {
    const { container } = render(<InlineHelp className="custom">Text</InlineHelp>);
    expect(container.querySelector('.custom')).toBeInTheDocument();
  });
});

describe('FeatureHighlight', () => {
  it('renders children', () => {
    render(
      <FeatureHighlight title="New Feature" description="Try this new feature">
        <button>My Button</button>
      </FeatureHighlight>
    );
    expect(screen.getByText('My Button')).toBeInTheDocument();
  });

  it('renders feature title and description', () => {
    render(
      <FeatureHighlight title="New Feature" description="Try this">
        <button>Button</button>
      </FeatureHighlight>
    );
    expect(screen.getByText('New Feature')).toBeInTheDocument();
    expect(screen.getByText('Try this')).toBeInTheDocument();
  });

  it('renders NOVO badge when isNew is true', () => {
    render(
      <FeatureHighlight title="Feature" description="Desc" isNew>
        <button>Button</button>
      </FeatureHighlight>
    );
    expect(screen.getByText('NOVO')).toBeInTheDocument();
  });

  it('renders Entendi dismiss button', () => {
    render(
      <FeatureHighlight title="Feature" description="Desc">
        <button>Button</button>
      </FeatureHighlight>
    );
    expect(screen.getByText('Entendi')).toBeInTheDocument();
  });
});
