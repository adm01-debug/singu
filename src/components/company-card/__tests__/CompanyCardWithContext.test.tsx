import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/hooks/usePrefetch', () => ({
  usePrefetch: () => ({ prefetchCompany: vi.fn() }),
  usePrefetchOnHover: () => ({}),
}));

vi.mock('@/components/context-menu/QuickActionsMenu', () => ({
  QuickActionsMenu: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/inline-edit/InlineEdit', () => ({
  InlineEdit: ({ value }: any) => <input defaultValue={value} />,
}));

import { CompanyCardWithContext } from '../CompanyCardWithContext';

const mockCompany = {
  id: 'comp1',
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '1155555555',
  industry: 'Tecnologia',
  city: 'São Paulo',
  state: 'SP',
  logo_url: null,
  financial_health: 'good',
  tags: ['SaaS', 'Enterprise', 'B2B', 'Cloud'],
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  user_id: 'user1',
};

const defaultProps = {
  company: mockCompany as any,
  index: 0,
  isSelected: false,
  isHighlighted: false,
  selectionMode: false,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onUpdate: vi.fn().mockResolvedValue(null),
};

describe('CompanyCardWithContext', () => {
  it('renders company name', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders industry', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText(/São Paulo.*SP/)).toBeInTheDocument();
  });

  it('renders phone', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('1155555555')).toBeInTheDocument();
  });

  it('renders email', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
  });

  it('renders financial health badge', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('Boa')).toBeInTheDocument();
  });

  it('renders tags with truncation', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('SaaS')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('B2B')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows checkbox in selection mode', () => {
    render(<CompanyCardWithContext {...defaultProps} selectionMode />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('applies highlighted styling', () => {
    const { container } = render(<CompanyCardWithContext {...defaultProps} isHighlighted />);
    expect(container.innerHTML).toContain('ring-primary');
  });

  it('links to company detail page', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    const links = screen.getAllByRole('link');
    const companyLink = links.find(l => l.getAttribute('href') === '/empresas/comp1');
    expect(companyLink).toBeTruthy();
  });

  it('renders fallback initial when no logo', () => {
    render(<CompanyCardWithContext {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows "Sem segmento" when no industry', () => {
    const company = { ...mockCompany, industry: null };
    render(<CompanyCardWithContext {...defaultProps} company={company as any} />);
    expect(screen.getByText('Sem segmento')).toBeInTheDocument();
  });
});
