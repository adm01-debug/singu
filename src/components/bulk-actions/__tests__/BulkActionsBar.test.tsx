import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BulkActionsBar } from '../BulkActionsBar';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('BulkActionsBar', () => {
  const defaultProps = {
    selectedIds: ['1', '2', '3'],
    totalCount: 10,
    entityType: 'contacts' as const,
    onClearSelection: vi.fn(),
    onSelectAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when items are selected', () => {
    render(<BulkActionsBar {...defaultProps} />);
    expect(screen.getByText('3 de 10 selecionados')).toBeInTheDocument();
  });

  it('does not render when no items are selected', () => {
    render(<BulkActionsBar {...defaultProps} selectedIds={[]} />);
    expect(screen.queryByText('selecionados')).not.toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<BulkActionsBar {...defaultProps} />);
    // X close button should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders delete button when onDelete is provided', () => {
    render(<BulkActionsBar {...defaultProps} onDelete={vi.fn()} />);
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('does not render delete button when onDelete is not provided', () => {
    render(<BulkActionsBar {...defaultProps} />);
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument();
  });

  it('renders export button when onExport is provided', () => {
    render(<BulkActionsBar {...defaultProps} onExport={vi.fn()} />);
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('renders email button when onSendEmail is provided', () => {
    render(<BulkActionsBar {...defaultProps} onSendEmail={vi.fn()} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders favorite button when onToggleFavorite is provided', () => {
    render(<BulkActionsBar {...defaultProps} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText('Favoritar')).toBeInTheDocument();
  });

  it('renders Tag dropdown when onAddTag is provided', () => {
    render(<BulkActionsBar {...defaultProps} onAddTag={vi.fn()} />);
    expect(screen.getByText('Tag')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when delete is clicked', () => {
    render(<BulkActionsBar {...defaultProps} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('Excluir'));
    expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument();
  });

  it('shows entity type in delete confirmation', () => {
    render(<BulkActionsBar {...defaultProps} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('Excluir'));
    expect(screen.getByText(/3 contatos/)).toBeInTheDocument();
  });

  it('renders Todos/Limpar toggle button', () => {
    render(<BulkActionsBar {...defaultProps} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('shows Limpar when all items are selected', () => {
    render(<BulkActionsBar {...defaultProps} selectedIds={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']} />);
    expect(screen.getByText('Limpar')).toBeInTheDocument();
  });

  it('calls onClearSelection when close button is clicked', () => {
    render(<BulkActionsBar {...defaultProps} />);
    // The last button in the bar is the close (X) button
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[buttons.length - 1];
    fireEvent.click(closeButton);
    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });
});
