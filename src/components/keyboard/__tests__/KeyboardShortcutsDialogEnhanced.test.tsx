import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KeyboardShortcutsDialogEnhanced, ShortcutHint } from '../KeyboardShortcutsDialogEnhanced';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  isMacOS: () => false,
}));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({
  useKeyboardShortcutsEnhanced: () => ({
    groupedShortcuts: {
      navigation: [
        { description: 'Ir para Dashboard', key: '1', modifier: 'alt', category: 'navigation' },
        { description: 'Busca global', key: 'k', modifier: 'ctrl', category: 'navigation' },
      ],
      actions: [
        { description: 'Novo contato', key: 'c', modifier: 'alt', category: 'actions' },
      ],
    },
    formatShortcut: (s: any) => {
      const parts = [];
      if (s.modifier === 'ctrl') parts.push('Ctrl');
      if (s.modifier === 'alt') parts.push('Alt');
      parts.push(s.key.toUpperCase());
      return parts;
    },
  }),
  shortcutCategoryLabels: {
    navigation: 'Navegação',
    actions: 'Ações',
  },
}));

describe('KeyboardShortcutsDialogEnhanced', () => {
  it('does not render dialog by default', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument();
  });

  it('opens when show-keyboard-shortcuts event is dispatched', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument();
  });

  it('renders search input when open', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getByPlaceholderText('Buscar atalhos...')).toBeInTheDocument();
  });

  it('renders category labels when open', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getByText('Navegação')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('renders shortcut descriptions when open', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getByText('Ir para Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Busca global')).toBeInTheDocument();
    expect(screen.getByText('Novo contato')).toBeInTheDocument();
  });

  it('renders keyboard key elements when open', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getAllByText('Alt').length).toBeGreaterThan(0);
  });

  it('filters shortcuts by search query', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    const input = screen.getByPlaceholderText('Buscar atalhos...');
    fireEvent.change(input, { target: { value: 'Dashboard' } });
    expect(screen.getByText('Ir para Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Novo contato')).not.toBeInTheDocument();
  });

  it('renders footer with keyboard hint', () => {
    render(<KeyboardShortcutsDialogEnhanced />);
    act(() => {
      window.dispatchEvent(new Event('show-keyboard-shortcuts'));
    });
    expect(screen.getByText(/Pressione/)).toBeInTheDocument();
  });
});

describe('ShortcutHint', () => {
  it('renders keyboard keys', () => {
    render(<ShortcutHint keys={['Ctrl', 'K']} />);
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders plus separator between keys', () => {
    render(<ShortcutHint keys={['Ctrl', 'K']} />);
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('renders single key without separator', () => {
    render(<ShortcutHint keys={['Esc']} />);
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});
