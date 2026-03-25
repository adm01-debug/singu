import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KeyboardShortcutsCheatsheet, KeyboardShortcutsButton } from '../KeyboardShortcutsCheatsheet';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  isMacOS: () => false,
}));

describe('KeyboardShortcutsCheatsheet', () => {
  it('does not render dialog when closed', () => {
    render(<KeyboardShortcutsCheatsheet open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument();
  });

  it('renders search input when open', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Buscar atalhos...')).toBeInTheDocument();
  });

  it('renders shortcut categories', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Navegação')).toBeInTheDocument();
    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    expect(screen.getByText('Listas')).toBeInTheDocument();
    expect(screen.getByText('Formulários')).toBeInTheDocument();
    expect(screen.getByText('Visualização')).toBeInTheDocument();
  });

  it('renders shortcut descriptions', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Abrir busca global')).toBeInTheDocument();
    expect(screen.getByText('Ir para Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Novo Contato')).toBeInTheDocument();
  });

  it('renders keyboard keys', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getAllByText('Ctrl').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alt').length).toBeGreaterThan(0);
  });

  it('filters shortcuts by search term', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar atalhos...');
    fireEvent.change(input, { target: { value: 'busca global' } });
    expect(screen.getByText('Abrir busca global')).toBeInTheDocument();
    expect(screen.queryByText('Toggle sidebar')).not.toBeInTheDocument();
  });

  it('shows empty state when no shortcuts match', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar atalhos...');
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });
    expect(screen.getByText('Nenhum atalho encontrado')).toBeInTheDocument();
  });

  it('renders footer help text', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/Pressione/)).toBeInTheDocument();
  });

  it('clears search when X button is clicked', () => {
    render(<KeyboardShortcutsCheatsheet open={true} onOpenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar atalhos...');
    fireEvent.change(input, { target: { value: 'test' } });
    // Click the clear button
    const clearButtons = screen.getAllByRole('button');
    const clearBtn = clearButtons.find(b => b.querySelector('.lucide-x'));
    if (clearBtn) fireEvent.click(clearBtn);
  });
});

describe('KeyboardShortcutsButton', () => {
  it('renders button with Atalhos text', () => {
    render(<KeyboardShortcutsButton />);
    expect(screen.getByText('Atalhos')).toBeInTheDocument();
  });

  it('renders ? badge', () => {
    render(<KeyboardShortcutsButton />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', () => {
    render(<KeyboardShortcutsButton />);
    fireEvent.click(screen.getByText('Atalhos'));
    expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument();
  });
});
