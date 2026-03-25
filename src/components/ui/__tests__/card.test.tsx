import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass('rounded-lg', 'border');
  });

  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>);
    expect(container.firstChild).toHaveClass('shadow-lg');
  });

  it('applies ghost variant', () => {
    const { container } = render(<Card variant="ghost">Ghost</Card>);
    expect(container.firstChild).toHaveClass('border-transparent');
  });

  it('applies interactive variant', () => {
    const { container } = render(<Card variant="interactive">Interactive</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('applies custom padding', () => {
    const { container } = render(<Card padding="lg">Padded</Card>);
    expect(container.firstChild?.className).toContain('p-8');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="my-class">Test</Card>);
    expect(container.firstChild).toHaveClass('my-class');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies flex and padding styles', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'p-6');
  });
});

describe('CardTitle', () => {
  it('renders heading text', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('applies font-semibold class', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    expect(container.firstChild).toHaveClass('font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies muted text style', () => {
    const { container } = render(<CardDescription>Desc</CardDescription>);
    expect(container.firstChild).toHaveClass('text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies padding', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('p-6');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies flex and padding', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('flex', 'items-center', 'p-6');
  });
});

describe('Card composition', () => {
  it('renders a complete card', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
          <CardDescription>A description</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('My Card')).toBeInTheDocument();
    expect(screen.getByText('A description')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
