import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  usePrefetch: () => ({ prefetchContact: vi.fn(), prefetchInteractions: vi.fn() }),
  usePrefetchOnHover: () => ({}),
}));

vi.mock('@/components/context-menu/QuickActionsMenu', () => ({
  QuickActionsMenu: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/inline-edit/InlineEdit', () => ({
  InlineEdit: ({ value }: any) => <input defaultValue={value} />,
}));

// Mock IntersectionObserver
window.IntersectionObserver = vi.fn().mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

vi.mock('@/types', () => ({}));

import { ContactCardWithContext } from '../ContactCardWithContext';

const mockContact = {
  id: 'c1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '11999999999',
  whatsapp: null,
  linkedin: null,
  role: 'contact',
  role_title: 'Developer',
  sentiment: 'positive',
  relationship_score: 75,
  relationship_stage: 'customer',
  behavior: { discProfile: 'D' },
  avatar_url: null,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  company_id: 'comp1',
  user_id: 'user1',
};

const defaultProps = {
  contact: mockContact as any,
  companyName: 'Acme Corp',
  lastInteraction: new Date().toISOString(),
  index: 0,
  isSelected: false,
  isHighlighted: false,
  selectionMode: false,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onUpdate: vi.fn().mockResolvedValue(null),
  viewMode: 'grid' as const,
};

describe('ContactCardWithContext', () => {
  it('renders contact name', () => {
    render(<ContactCardWithContext {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<ContactCardWithContext {...defaultProps} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders role title', () => {
    render(<ContactCardWithContext {...defaultProps} />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('renders in grid view', () => {
    const { container } = render(<ContactCardWithContext {...defaultProps} viewMode="grid" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders in list view', () => {
    render(<ContactCardWithContext {...defaultProps} viewMode="list" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows checkbox in selection mode', () => {
    render(<ContactCardWithContext {...defaultProps} selectionMode />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('applies highlighted styling', () => {
    const { container } = render(<ContactCardWithContext {...defaultProps} isHighlighted />);
    expect(container.innerHTML).toContain('ring-primary');
  });

  it('applies selected styling', () => {
    const { container } = render(<ContactCardWithContext {...defaultProps} isSelected />);
    expect(container.innerHTML).toContain('primary/5');
  });

  it('links to contact detail page', () => {
    render(<ContactCardWithContext {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/contatos/c1');
  });

  it('shows "Sem cargo" when no role_title', () => {
    const contact = { ...mockContact, role_title: null };
    render(<ContactCardWithContext {...defaultProps} contact={contact as any} />);
    expect(screen.getByText('Sem cargo')).toBeInTheDocument();
  });
});
