import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Typography, Heading, DisplayText } from '../typography';

describe('Typography', () => {
  it('renders text content', () => {
    render(<Typography>Hello World</Typography>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders with h1 variant', () => {
    render(<Typography variant="h1">Title</Typography>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders with h2 variant', () => {
    render(<Typography variant="h2">Subtitle</Typography>);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('renders with body variant', () => {
    render(<Typography variant="body">Body text</Typography>);
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('renders with small variant', () => {
    render(<Typography variant="small">Small text</Typography>);
    expect(screen.getByText('Small text')).toBeInTheDocument();
  });

  it('renders with caption variant', () => {
    render(<Typography variant="caption">Caption</Typography>);
    expect(screen.getByText('Caption')).toBeInTheDocument();
  });

  it('renders with lead variant', () => {
    render(<Typography variant="lead">Lead</Typography>);
    expect(screen.getByText('Lead')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(<Typography className="custom">Text</Typography>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders with custom as prop', () => {
    render(<Typography as="span">Span text</Typography>);
    const el = screen.getByText('Span text');
    expect(el.tagName).toBe('SPAN');
  });
});

describe('Heading', () => {
  it('renders heading text', () => {
    render(<Heading>Heading</Heading>);
    expect(screen.getByText('Heading')).toBeInTheDocument();
  });

  it('renders with level 1', () => {
    render(<Heading level={1}>H1</Heading>);
    expect(screen.getByText('H1').tagName).toBe('H1');
  });

  it('renders with level 2', () => {
    render(<Heading level={2}>H2</Heading>);
    expect(screen.getByText('H2').tagName).toBe('H2');
  });

  it('renders with level 3', () => {
    render(<Heading level={3}>H3</Heading>);
    expect(screen.getByText('H3').tagName).toBe('H3');
  });
});

describe('DisplayText', () => {
  it('renders display text', () => {
    render(<DisplayText>Big Title</DisplayText>);
    expect(screen.getByText('Big Title')).toBeInTheDocument();
  });
});
