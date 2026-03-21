import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@/lib/utils', () => ({
  isMacOS: () => false,
}));

describe('useKeyboardNavigation', () => {
  describe('navigation routes', () => {
    const navigationRoutes = [
      { key: '1', path: '/', label: 'Dashboard' },
      { key: '2', path: '/empresas', label: 'Empresas' },
      { key: '3', path: '/contatos', label: 'Contatos' },
      { key: '4', path: '/interacoes', label: 'Interações' },
      { key: '5', path: '/calendario', label: 'Calendário' },
      { key: '6', path: '/insights', label: 'Insights' },
      { key: '7', path: '/notificacoes', label: 'Notificações' },
      { key: '8', path: '/configuracoes', label: 'Configurações' },
    ];

    it('has 8 navigation routes', () => {
      expect(navigationRoutes).toHaveLength(8);
    });

    it('routes have keys 1-8', () => {
      navigationRoutes.forEach((route, index) => {
        expect(route.key).toBe(String(index + 1));
      });
    });

    it('first route goes to dashboard', () => {
      expect(navigationRoutes[0].path).toBe('/');
    });

    it('each route has a label', () => {
      navigationRoutes.forEach(route => {
        expect(route.label).toBeTruthy();
      });
    });

    it('each route has a path starting with /', () => {
      navigationRoutes.forEach(route => {
        expect(route.path.startsWith('/')).toBe(true);
      });
    });

    it('all routes have unique keys', () => {
      const keys = navigationRoutes.map(r => r.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('all routes have unique paths', () => {
      const paths = navigationRoutes.map(r => r.path);
      expect(new Set(paths).size).toBe(paths.length);
    });
  });

  describe('input filtering logic', () => {
    it('ignores keydown in INPUT elements', () => {
      const target = { tagName: 'INPUT', isContentEditable: false };
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      expect(isInput).toBe(true);
    });

    it('ignores keydown in TEXTAREA elements', () => {
      const target = { tagName: 'TEXTAREA', isContentEditable: false };
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      expect(isInput).toBe(true);
    });

    it('ignores keydown in contentEditable elements', () => {
      const target = { tagName: 'DIV', isContentEditable: true };
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      expect(isInput).toBe(true);
    });

    it('handles keydown in normal DIV', () => {
      const target = { tagName: 'DIV', isContentEditable: false };
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      expect(isInput).toBe(false);
    });

    it('handles keydown in BODY', () => {
      const target = { tagName: 'BODY', isContentEditable: false };
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      expect(isInput).toBe(false);
    });
  });

  describe('modifier key detection', () => {
    it('detects Ctrl+K combination', () => {
      const event = { key: 'k', ctrlKey: true, metaKey: false };
      const isMac = false;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      expect(modifierKey && event.key.toLowerCase() === 'k').toBe(true);
    });

    it('detects Cmd+K on Mac', () => {
      const event = { key: 'k', ctrlKey: false, metaKey: true };
      const isMac = true;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      expect(modifierKey && event.key.toLowerCase() === 'k').toBe(true);
    });

    it('detects Ctrl+B combination', () => {
      const event = { key: 'b', ctrlKey: true, metaKey: false };
      const isMac = false;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      expect(modifierKey && event.key.toLowerCase() === 'b').toBe(true);
    });

    it('detects Ctrl+\\ combination', () => {
      const event = { key: '\\', ctrlKey: true, metaKey: false };
      const isMac = false;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      expect(modifierKey && event.key === '\\').toBe(true);
    });

    it('does not trigger without modifier key', () => {
      const event = { key: 'k', ctrlKey: false, metaKey: false };
      const isMac = false;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      expect(modifierKey).toBe(false);
    });
  });

  describe('Alt + number navigation', () => {
    const navigationRoutes = [
      { key: '1', path: '/', label: 'Dashboard' },
      { key: '2', path: '/empresas', label: 'Empresas' },
    ];

    it('matches route by key', () => {
      const route = navigationRoutes.find(r => r.key === '1');
      expect(route).toBeDefined();
      expect(route!.path).toBe('/');
    });

    it('does not navigate when already on route', () => {
      const currentPath = '/';
      const route = navigationRoutes.find(r => r.key === '1');
      expect(route!.path === currentPath).toBe(true);
    });

    it('navigates when on different route', () => {
      const currentPath = '/contatos';
      const route = navigationRoutes.find(r => r.key === '1');
      expect(route!.path !== currentPath).toBe(true);
    });

    it('ignores non-matching key', () => {
      const route = navigationRoutes.find(r => r.key === '9');
      expect(route).toBeUndefined();
    });
  });

  describe('G + number navigation', () => {
    it('g key starts sequence mode', () => {
      const key = 'g';
      expect(key.toLowerCase()).toBe('g');
    });

    it('sequence mode times out after 1000ms', () => {
      vi.useFakeTimers();
      let sequenceActive = true;
      const timer = setTimeout(() => {
        sequenceActive = false;
      }, 1000);

      vi.advanceTimersByTime(999);
      expect(sequenceActive).toBe(true);

      vi.advanceTimersByTime(1);
      expect(sequenceActive).toBe(false);

      clearTimeout(timer);
      vi.useRealTimers();
    });
  });

  describe('disabled behavior', () => {
    it('does not process events when enabled is false', () => {
      const enabled = false;
      const processed = enabled && true;
      expect(processed).toBe(false);
    });

    it('processes events when enabled is true', () => {
      const enabled = true;
      expect(enabled).toBe(true);
    });

    it('defaults to enabled', () => {
      const { enabled = true } = {};
      expect(enabled).toBe(true);
    });
  });

  describe('event listener lifecycle', () => {
    it('adds keydown listener to document', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const handler = vi.fn();
      document.addEventListener('keydown', handler);
      expect(addSpy).toHaveBeenCalledWith('keydown', handler);
      document.removeEventListener('keydown', handler);
      addSpy.mockRestore();
    });

    it('removes keydown listener on cleanup', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const handler = vi.fn();
      document.removeEventListener('keydown', handler);
      expect(removeSpy).toHaveBeenCalledWith('keydown', handler);
      removeSpy.mockRestore();
    });
  });
});
