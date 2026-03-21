import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecentFavoritesMenu } from '../RecentFavoritesMenu';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@/components/ui/optimized-avatar', () => ({
  OptimizedAvatar: ({ fallback }: any) => <span data-testid="avatar">{fallback}</span>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('RecentFavoritesMenu', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders trigger button for contacts', () => {
    render(<RecentFavoritesMenu type="contact" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders trigger button for companies', () => {
    render(<RecentFavoritesMenu type="company" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens popover when trigger is clicked', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('shows Empresas header for company type', () => {
    render(<RecentFavoritesMenu type="company" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Empresas')).toBeInTheDocument();
  });

  it('renders search input in popover', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders Recent and Favorites tabs', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Recentes/)).toBeInTheDocument();
    expect(screen.getByText(/Favoritos/)).toBeInTheDocument();
  });

  it('shows empty state for recent items', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Nenhum item recente')).toBeInTheDocument();
  });

  it('switches to favorites tab', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/Favoritos/));
    expect(screen.getByText('Nenhum favorito')).toBeInTheDocument();
  });

  it('renders custom trigger when provided', () => {
    render(
      <RecentFavoritesMenu
        type="contact"
        trigger={<button data-testid="custom-trigger">Custom</button>}
      />
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });

  it('renders count in tab labels', () => {
    render(<RecentFavoritesMenu type="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Recentes \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Favoritos \(0\)/)).toBeInTheDocument();
  });
});
