import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextualHelpTooltip, helpContent } from '../ContextualHelpTooltip';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      return ({ children, ...props }: any) => {
        const Element = typeof tag === 'string' ? tag : 'div';
        return <Element {...props}>{children}</Element>;
      };
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('ContextualHelpTooltip', () => {
  it('renders help icon', () => {
    render(
      <ContextualHelpTooltip title="Help" description="Some help text" />
    );
    const btn = screen.getByRole('button', { name: /ajuda/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders with custom aria-label', () => {
    render(
      <ContextualHelpTooltip
        title="Help"
        description="Some help text"
        ariaLabel="Custom help"
      />
    );
    expect(screen.getByRole('button', { name: 'Custom help' })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ContextualHelpTooltip title="Help" description="Help text">
        <span>Label text</span>
      </ContextualHelpTooltip>
    );
    expect(screen.getByText('Label text')).toBeInTheDocument();
  });

  it('renders with size sm', () => {
    const { container } = render(
      <ContextualHelpTooltip title="Help" description="Text" size="sm" />
    );
    expect(container.querySelector('.w-3')).toBeInTheDocument();
  });

  it('renders with size md', () => {
    const { container } = render(
      <ContextualHelpTooltip title="Help" description="Text" size="md" />
    );
    expect(container.querySelector('.w-4')).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(
      <ContextualHelpTooltip title="Help" description="Text" size="lg" />
    );
    expect(container.querySelector('.w-5')).toBeInTheDocument();
  });

  it('renders in tooltip mode by default', () => {
    const { container } = render(
      <ContextualHelpTooltip title="Help" description="Text" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders in popover mode', () => {
    const { container } = render(
      <ContextualHelpTooltip title="Help" description="Text" mode="popover" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with position before', () => {
    render(
      <ContextualHelpTooltip title="Help" description="Text" position="before">
        <span>Content</span>
      </ContextualHelpTooltip>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('helpContent', () => {
  it('has relationshipScore entry', () => {
    expect(helpContent.relationshipScore).toBeDefined();
    expect(helpContent.relationshipScore.title).toBe('Score de Relacionamento');
  });

  it('has discProfile entry', () => {
    expect(helpContent.discProfile).toBeDefined();
    expect(helpContent.discProfile.title).toBe('Perfil DISC');
  });

  it('has vakProfile entry', () => {
    expect(helpContent.vakProfile).toBeDefined();
    expect(helpContent.vakProfile.tips).toHaveLength(3);
  });
});
