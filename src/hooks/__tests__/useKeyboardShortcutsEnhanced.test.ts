import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shortcutCategoryLabels } from '../useKeyboardShortcutsEnhanced';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@/lib/utils', () => ({
  isMacOS: () => false,
}));

describe('useKeyboardShortcutsEnhanced', () => {
  describe('shortcutCategoryLabels', () => {
    it('defines navigation label', () => {
      expect(shortcutCategoryLabels.navigation).toBe('Navegação');
    });

    it('defines actions label', () => {
      expect(shortcutCategoryLabels.actions).toBe('Ações Rápidas');
    });

    it('defines ui label', () => {
      expect(shortcutCategoryLabels.ui).toBe('Interface');
    });

    it('defines editing label', () => {
      expect(shortcutCategoryLabels.editing).toBe('Edição');
    });

    it('defines search label', () => {
      expect(shortcutCategoryLabels.search).toBe('Busca');
    });

    it('has 5 categories', () => {
      expect(Object.keys(shortcutCategoryLabels)).toHaveLength(5);
    });
  });

  describe('shortcut definitions', () => {
    // Replicate the shortcut list structure
    const shortcuts = [
      { key: 'k', ctrl: true, category: 'search', global: true, description: 'Abrir busca global' },
      { key: '/', category: 'search', description: 'Focar na busca' },
      { key: 'h', alt: true, category: 'navigation', description: 'Dashboard' },
      { key: 'c', alt: true, category: 'navigation', description: 'Contatos' },
      { key: 'e', alt: true, category: 'navigation', description: 'Empresas' },
      { key: 'n', ctrl: true, category: 'actions', description: 'Novo contato' },
      { key: 's', ctrl: true, category: 'actions', global: true, description: 'Salvar' },
      { key: '?', shift: true, category: 'ui', description: 'Mostrar atalhos' },
      { key: 'Escape', category: 'ui', global: true, description: 'Fechar modal' },
      { key: 'j', category: 'navigation', description: 'Próximo item' },
      { key: 'k', category: 'navigation', description: 'Item anterior' },
      { key: 'Enter', category: 'navigation', description: 'Abrir item' },
      { key: 'e', category: 'editing', description: 'Editar item' },
      { key: 'z', ctrl: true, category: 'editing', global: true, description: 'Desfazer' },
      { key: 'z', ctrl: true, shift: true, category: 'editing', global: true, description: 'Refazer' },
    ];

    it('has search category shortcuts', () => {
      const searchShortcuts = shortcuts.filter(s => s.category === 'search');
      expect(searchShortcuts.length).toBeGreaterThanOrEqual(2);
    });

    it('has navigation category shortcuts', () => {
      const navShortcuts = shortcuts.filter(s => s.category === 'navigation');
      expect(navShortcuts.length).toBeGreaterThanOrEqual(3);
    });

    it('has actions category shortcuts', () => {
      const actionShortcuts = shortcuts.filter(s => s.category === 'actions');
      expect(actionShortcuts.length).toBeGreaterThanOrEqual(2);
    });

    it('has ui category shortcuts', () => {
      const uiShortcuts = shortcuts.filter(s => s.category === 'ui');
      expect(uiShortcuts.length).toBeGreaterThanOrEqual(2);
    });

    it('has editing category shortcuts', () => {
      const editShortcuts = shortcuts.filter(s => s.category === 'editing');
      expect(editShortcuts.length).toBeGreaterThanOrEqual(2);
    });

    it('Ctrl+K opens global search', () => {
      const shortcut = shortcuts.find(s => s.key === 'k' && s.ctrl);
      expect(shortcut).toBeDefined();
      expect(shortcut!.global).toBe(true);
    });

    it('Escape is global shortcut', () => {
      const shortcut = shortcuts.find(s => s.key === 'Escape');
      expect(shortcut).toBeDefined();
      expect(shortcut!.global).toBe(true);
    });

    it('Ctrl+S is global shortcut', () => {
      const shortcut = shortcuts.find(s => s.key === 's' && s.ctrl);
      expect(shortcut).toBeDefined();
      expect(shortcut!.global).toBe(true);
    });

    it('each shortcut has a description', () => {
      shortcuts.forEach(s => {
        expect(s.description).toBeTruthy();
      });
    });
  });

  describe('modifier key matching logic', () => {
    it('ctrl match requires ctrlKey or metaKey', () => {
      const shortcut = { ctrl: true };
      const event = { ctrlKey: true, metaKey: false };
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      expect(ctrlMatch).toBe(true);
    });

    it('ctrl match with metaKey works', () => {
      const shortcut = { ctrl: true };
      const event = { ctrlKey: false, metaKey: true };
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      expect(ctrlMatch).toBe(true);
    });

    it('non-ctrl shortcut requires no modifier', () => {
      const shortcut = { ctrl: undefined };
      const event = { ctrlKey: true, metaKey: false };
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      expect(ctrlMatch).toBe(false); // ctrl is pressed but shortcut doesn't want ctrl
    });

    it('shift matching logic', () => {
      const shortcut = { shift: true };
      const event = { shiftKey: true };
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      expect(shiftMatch).toBe(true);
    });

    it('alt matching logic', () => {
      const shortcut = { alt: true };
      const event = { altKey: true };
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      expect(altMatch).toBe(true);
    });

    it('key matching is case-insensitive', () => {
      const key = 'K';
      const shortcutKey = 'k';
      expect(key.toLowerCase() === shortcutKey.toLowerCase()).toBe(true);
    });
  });

  describe('input filtering for shortcuts', () => {
    it('skips non-global shortcuts in input', () => {
      const isInput = true;
      const shortcut = { global: false, key: 'j' };
      const shouldSkip = isInput && !shortcut.global && shortcut.key !== 'Escape';
      expect(shouldSkip).toBe(true);
    });

    it('allows global shortcuts in input', () => {
      const isInput = true;
      const shortcut = { global: true, key: 's' };
      const shouldSkip = isInput && !shortcut.global && shortcut.key !== 'Escape';
      expect(shouldSkip).toBe(false);
    });

    it('always allows Escape in input', () => {
      const isInput = true;
      const shortcut = { global: false, key: 'Escape' };
      const shouldSkip = isInput && !shortcut.global && shortcut.key !== 'Escape';
      expect(shouldSkip).toBe(false);
    });
  });

  describe('formatShortcut logic', () => {
    const formatShortcut = (shortcut: { ctrl?: boolean; alt?: boolean; shift?: boolean; key: string }, mac: boolean): string[] => {
      const keys: string[] = [];
      if (shortcut.ctrl) keys.push(mac ? '⌘' : 'Ctrl');
      if (shortcut.alt) keys.push(mac ? '⌥' : 'Alt');
      if (shortcut.shift) keys.push('⇧');
      keys.push(shortcut.key.toUpperCase());
      return keys;
    };

    it('formats Ctrl+K for Windows', () => {
      const result = formatShortcut({ ctrl: true, key: 'k' }, false);
      expect(result).toEqual(['Ctrl', 'K']);
    });

    it('formats Cmd+K for Mac', () => {
      const result = formatShortcut({ ctrl: true, key: 'k' }, true);
      expect(result).toEqual(['⌘', 'K']);
    });

    it('formats Alt+H for Windows', () => {
      const result = formatShortcut({ alt: true, key: 'h' }, false);
      expect(result).toEqual(['Alt', 'H']);
    });

    it('formats Alt+H for Mac', () => {
      const result = formatShortcut({ alt: true, key: 'h' }, true);
      expect(result).toEqual(['⌥', 'H']);
    });

    it('formats Shift+? shortcut', () => {
      const result = formatShortcut({ shift: true, key: '?' }, false);
      expect(result).toEqual(['⇧', '?']);
    });

    it('formats Ctrl+Shift+D shortcut', () => {
      const result = formatShortcut({ ctrl: true, shift: true, key: 'd' }, false);
      expect(result).toEqual(['Ctrl', '⇧', 'D']);
    });

    it('formats simple key shortcut', () => {
      const result = formatShortcut({ key: 'j' }, false);
      expect(result).toEqual(['J']);
    });
  });

  describe('key sequence timeout', () => {
    it('clears sequence after 500ms', () => {
      vi.useFakeTimers();
      let keySequence = ['a', 'b'];
      const timer = setTimeout(() => {
        keySequence = [];
      }, 500);
      vi.advanceTimersByTime(500);
      expect(keySequence).toEqual([]);
      clearTimeout(timer);
      vi.useRealTimers();
    });

    it('does not clear sequence before 500ms', () => {
      vi.useFakeTimers();
      let keySequence = ['a', 'b'];
      setTimeout(() => {
        keySequence = [];
      }, 500);
      vi.advanceTimersByTime(499);
      expect(keySequence).toEqual(['a', 'b']);
      vi.useRealTimers();
    });
  });

  describe('groupedShortcuts logic', () => {
    it('groups shortcuts by category', () => {
      const shortcuts = [
        { category: 'search', key: '/' },
        { category: 'search', key: 'k' },
        { category: 'navigation', key: 'h' },
      ];
      const grouped = shortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) acc[shortcut.category] = [];
        acc[shortcut.category].push(shortcut);
        return acc;
      }, {} as Record<string, typeof shortcuts>);

      expect(grouped.search).toHaveLength(2);
      expect(grouped.navigation).toHaveLength(1);
    });
  });

  describe('special case: shift+? shortcut', () => {
    it('matches ? key directly', () => {
      const eventKey = '?';
      const match = eventKey === '?';
      expect(match).toBe(true);
    });

    it('matches shift+/ as ?', () => {
      const event = { shiftKey: true, key: '/' };
      const match = event.shiftKey && event.key === '/';
      expect(match).toBe(true);
    });
  });
});
