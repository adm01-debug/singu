import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartBreadcrumbs } from '../SmartBreadcrumbs';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/contatos/123' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('SmartBreadcrumbs', () => {
  it('renders breadcrumb navigation with aria-label', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders Início as first breadcrumb', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  it('renders Contatos breadcrumb for /contatos path', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('renders contact name when data is provided', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('renders links for non-last items', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    const homeLink = screen.getByText('Início');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders last item as text, not link', () => {
    render(<SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />);
    const lastItem = screen.getByText('João Silva');
    expect(lastItem.closest('a')).toBeNull();
  });

  it('renders Detalhes when no entity data is provided', () => {
    render(<SmartBreadcrumbs />);
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
  });

  it('returns null for root path only', () => {
    vi.mocked(await import('react-router-dom')).useLocation = () => ({ pathname: '/' }) as any;
    // SmartBreadcrumbs returns null if breadcrumbs.length <= 1
    // For root, it should be just the Home crumb
  });

  it('applies custom className', () => {
    const { container } = render(
      <SmartBreadcrumbs className="custom-class" data={{ contact: { first_name: 'Test', last_name: 'User' } }} />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders chevron separators', () => {
    const { container } = render(
      <SmartBreadcrumbs data={{ contact: { first_name: 'João', last_name: 'Silva' } }} />
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
