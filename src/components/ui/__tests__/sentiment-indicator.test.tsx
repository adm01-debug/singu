import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SentimentIndicator } from '../sentiment-indicator';

vi.mock('@/types', () => ({}));

describe('SentimentIndicator', () => {
  it('renders positive sentiment', () => {
    const { container } = render(<SentimentIndicator sentiment="positive" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders neutral sentiment', () => {
    const { container } = render(<SentimentIndicator sentiment="neutral" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders negative sentiment', () => {
    const { container } = render(<SentimentIndicator sentiment="negative" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size sm', () => {
    const { container } = render(<SentimentIndicator sentiment="positive" size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size md', () => {
    const { container } = render(<SentimentIndicator sentiment="positive" size="md" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(<SentimentIndicator sentiment="positive" size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows label when showLabel is true', () => {
    render(<SentimentIndicator sentiment="positive" showLabel />);
    expect(screen.getByText(/positiv/i)).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    const { container } = render(<SentimentIndicator sentiment="positive" showLabel={false} />);
    expect(container.textContent).toBe('');
  });
});
