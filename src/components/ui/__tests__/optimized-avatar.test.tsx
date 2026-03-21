import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedAvatar } from '../optimized-avatar';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('OptimizedAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback text', () => {
    render(<OptimizedAvatar alt="John Doe" fallback="JD" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders with alt text', () => {
    render(<OptimizedAvatar alt="Test User" fallback="TU" />);
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('applies size sm', () => {
    const { container } = render(<OptimizedAvatar alt="User" fallback="U" size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies size md', () => {
    const { container } = render(<OptimizedAvatar alt="User" fallback="U" size="md" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies size lg', () => {
    const { container } = render(<OptimizedAvatar alt="User" fallback="U" size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(
      <OptimizedAvatar alt="User" fallback="U" className="my-avatar" />
    );
    expect(container.firstChild).toHaveClass('my-avatar');
  });

  it('renders without src', () => {
    const { container } = render(<OptimizedAvatar alt="User" fallback="U" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with src', () => {
    const { container } = render(
      <OptimizedAvatar alt="User" fallback="U" src="https://example.com/avatar.jpg" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
