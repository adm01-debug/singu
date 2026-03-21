import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchPresetsMenu } from '../SearchPresetsMenu';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@/hooks/useSearchPresets', () => ({
  useSearchPresets: () => ({
    presets: [],
    savePreset: vi.fn(),
    deletePreset: vi.fn(),
  }),
}));

describe('SearchPresetsMenu', () => {
  const defaultProps = {
    currentFilters: {},
    currentSortBy: 'name',
    currentSortOrder: 'asc' as const,
    onApplyPreset: vi.fn(),
  };

  it('renders the presets button', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    expect(screen.getByLabelText('Presets de busca salvos')).toBeInTheDocument();
  });

  it('renders Presets text in button', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    expect(screen.getByText('Presets')).toBeInTheDocument();
  });

  it('opens popover when button is clicked', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    expect(screen.getByText('Presets de Busca')).toBeInTheDocument();
  });

  it('shows description text in popover', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    expect(screen.getByText('Salve e reutilize combinações de filtros')).toBeInTheDocument();
  });

  it('shows empty state when no presets', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    expect(screen.getByText('Nenhum preset salvo')).toBeInTheDocument();
  });

  it('shows save button when no active filters', () => {
    render(<SearchPresetsMenu {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    const saveButton = screen.getByText('Salvar filtros atuais como preset');
    expect(saveButton.closest('button')).toBeDisabled();
  });

  it('enables save button when there are active filters', () => {
    render(
      <SearchPresetsMenu
        {...defaultProps}
        currentFilters={{ status: ['active'] }}
      />
    );
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    const saveButton = screen.getByText('Salvar filtros atuais como preset');
    expect(saveButton.closest('button')).not.toBeDisabled();
  });

  it('shows naming input when save button is clicked with active filters', () => {
    render(
      <SearchPresetsMenu
        {...defaultProps}
        currentFilters={{ status: ['active'] }}
      />
    );
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    fireEvent.click(screen.getByText('Salvar filtros atuais como preset'));
    expect(screen.getByPlaceholderText('Nome do preset...')).toBeInTheDocument();
  });

  it('enables save when search term is present', () => {
    render(
      <SearchPresetsMenu
        {...defaultProps}
        currentSearchTerm="test"
      />
    );
    fireEvent.click(screen.getByLabelText('Presets de busca salvos'));
    const saveButton = screen.getByText('Salvar filtros atuais como preset');
    expect(saveButton.closest('button')).not.toBeDisabled();
  });
});
