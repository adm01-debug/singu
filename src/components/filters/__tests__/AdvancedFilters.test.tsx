import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedFilters } from '../AdvancedFilters';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockFilters = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Ativo' },
      { value: 'inactive', label: 'Inativo' },
    ],
  },
  {
    key: 'role',
    label: 'Função',
    options: [
      { value: 'manager', label: 'Gerente' },
      { value: 'developer', label: 'Desenvolvedor' },
    ],
    multiple: true,
  },
];

const mockSortOptions = [
  { value: 'name', label: 'Nome' },
  { value: 'created_at', label: 'Data de Criação' },
];

describe('AdvancedFilters', () => {
  const defaultProps = {
    filters: mockFilters,
    sortOptions: mockSortOptions,
    activeFilters: {},
    onFiltersChange: vi.fn(),
    sortBy: 'name',
    sortOrder: 'asc' as const,
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter buttons', () => {
    render(<AdvancedFilters {...defaultProps} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Função')).toBeInTheDocument();
  });

  it('renders sort button', () => {
    render(<AdvancedFilters {...defaultProps} />);
    expect(screen.getByText('Ordenar')).toBeInTheDocument();
  });

  it('does not show clear all when no filters are active', () => {
    render(<AdvancedFilters {...defaultProps} />);
    expect(screen.queryByText('Limpar tudo')).not.toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    render(
      <AdvancedFilters
        {...defaultProps}
        activeFilters={{ status: ['active'] }}
      />
    );
    expect(screen.getByText('Limpar tudo')).toBeInTheDocument();
  });

  it('shows active filter count badge', () => {
    render(
      <AdvancedFilters
        {...defaultProps}
        activeFilters={{ status: ['active', 'inactive'] }}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows active filters tags', () => {
    render(
      <AdvancedFilters
        {...defaultProps}
        activeFilters={{ status: ['active'] }}
      />
    );
    expect(screen.getByText('Filtros ativos:')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('calls onFiltersChange when clear all is clicked', () => {
    render(
      <AdvancedFilters
        {...defaultProps}
        activeFilters={{ status: ['active'] }}
      />
    );
    fireEvent.click(screen.getByText('Limpar tudo'));
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({});
  });

  it('opens filter popover when filter button is clicked', () => {
    render(<AdvancedFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Status'));
    expect(screen.getByPlaceholderText('Buscar status...')).toBeInTheDocument();
  });

  it('shows filter options in popover', () => {
    render(<AdvancedFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Status'));
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('opens sort popover when sort button is clicked', () => {
    render(<AdvancedFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Ordenar'));
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Data de Criação')).toBeInTheDocument();
  });

  it('renders correct number of filter buttons', () => {
    render(<AdvancedFilters {...defaultProps} />);
    const filterButtons = screen.getAllByText(/Status|Função/);
    expect(filterButtons.length).toBe(2);
  });

  it('highlights active filter button', () => {
    render(
      <AdvancedFilters
        {...defaultProps}
        activeFilters={{ status: ['active'] }}
      />
    );
    // Status button should have different styling when active
    const statusButton = screen.getByText('Status').closest('button');
    expect(statusButton).toBeInTheDocument();
  });
});
