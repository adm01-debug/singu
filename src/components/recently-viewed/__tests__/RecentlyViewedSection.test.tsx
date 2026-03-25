import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentlyViewedSection } from '../RecentlyViewedSection';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: (type: string) => ({
    recentItems: type === 'contact' ? [
      { id: '1', type: 'contact', name: 'John Doe', subtitle: 'Dev', viewedAt: new Date().toISOString() },
      { id: '2', type: 'contact', name: 'Jane Smith', subtitle: 'PM', viewedAt: new Date().toISOString() },
    ] : [],
  }),
}));

// Mock IntersectionObserver
window.IntersectionObserver = vi.fn().mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

describe('RecentlyViewedSection', () => {
  it('renders recently viewed contacts', () => {
    render(<RecentlyViewedSection type="contact" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders section header', () => {
    render(<RecentlyViewedSection type="contact" />);
    expect(screen.getByText('Vistos recentemente')).toBeInTheDocument();
  });

  it('renders subtitles', () => {
    render(<RecentlyViewedSection type="contact" />);
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
  });

  it('returns null when no items', () => {
    const { container } = render(<RecentlyViewedSection type="company" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders clickable items', () => {
    render(<RecentlyViewedSection type="contact" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('navigates on item click', async () => {
    const user = userEvent.setup();
    render(<RecentlyViewedSection type="contact" />);
    await user.click(screen.getByText('John Doe'));
  });
});
