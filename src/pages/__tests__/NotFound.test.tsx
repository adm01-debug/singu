import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/non-existent', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

import NotFound from '../NotFound';

describe('NotFound Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('shows 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('shows page not found message', () => {
    render(<NotFound />);
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('shows return to home link', () => {
    render(<NotFound />);
    const link = screen.getByText('Return to Home');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the home link as an anchor element', () => {
    render(<NotFound />);
    const link = screen.getByText('Return to Home');
    expect(link.tagName).toBe('A');
  });

  it('logs error on mount', async () => {
    render(<NotFound />);
    const { logger } = await import('@/lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/non-existent'
    );
  });

  it('renders centered content', () => {
    render(<NotFound />);
    const container = screen.getByText('404').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('does not crash on render', () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });
});
