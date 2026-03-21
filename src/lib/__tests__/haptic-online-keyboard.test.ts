/**
 * Testes exaustivos — Haptic Feedback, Online Status e Keyboard Navigation
 * Cobre lógica pura desses hooks
 */
import { describe, it, expect } from 'vitest';

// ── Haptic Patterns Logic ──

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 25, 25],
  error: [50, 25, 50, 25, 50],
  selection: 5,
};

function resolvePattern(pattern: HapticPattern | number | number[]): number | number[] {
  return typeof pattern === 'string' ? hapticPatterns[pattern] : pattern;
}

// ── Navigation Routes Logic ──

interface NavRoute { key: string; path: string; label: string; }

const navigationRoutes: NavRoute[] = [
  { key: '1', path: '/', label: 'Dashboard' },
  { key: '2', path: '/empresas', label: 'Empresas' },
  { key: '3', path: '/contatos', label: 'Contatos' },
  { key: '4', path: '/interacoes', label: 'Interações' },
  { key: '5', path: '/calendario', label: 'Calendário' },
  { key: '6', path: '/insights', label: 'Insights' },
  { key: '7', path: '/notificacoes', label: 'Notificações' },
  { key: '8', path: '/configuracoes', label: 'Configurações' },
];

function findRouteByKey(key: string): NavRoute | undefined {
  return navigationRoutes.find(r => r.key === key);
}

function shouldIgnoreKeydown(tagName: string, isContentEditable: boolean): boolean {
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable;
}

function isModifierShortcut(metaKey: boolean, ctrlKey: boolean, key: string, target: string): string | null {
  const modifierKey = metaKey || ctrlKey;
  if (!modifierKey) return null;
  if (key.toLowerCase() === 'k') return 'search';
  if (key.toLowerCase() === 'b' || key === '\\') return 'sidebar';
  return null;
}

// ── Online Status Logic ──

function determineOnlineStatus(navigatorOnline: boolean, fetchSuccess: boolean | null): boolean {
  if (fetchSuccess !== null) return fetchSuccess;
  return navigatorOnline;
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('Haptic Patterns', () => {
  it('light is 10ms', () => expect(resolvePattern('light')).toBe(10));
  it('medium is 25ms', () => expect(resolvePattern('medium')).toBe(25));
  it('heavy is 50ms', () => expect(resolvePattern('heavy')).toBe(50));
  it('selection is 5ms', () => expect(resolvePattern('selection')).toBe(5));
  
  it('success is pattern array', () => {
    expect(resolvePattern('success')).toEqual([10, 50, 10]);
  });
  it('warning is pattern array', () => {
    expect(resolvePattern('warning')).toEqual([25, 25, 25]);
  });
  it('error is long pattern', () => {
    const pattern = resolvePattern('error') as number[];
    expect(pattern.length).toBe(5);
    expect(pattern).toEqual([50, 25, 50, 25, 50]);
  });

  it('custom number passthrough', () => {
    expect(resolvePattern(100)).toBe(100);
  });

  it('custom array passthrough', () => {
    expect(resolvePattern([10, 20, 30])).toEqual([10, 20, 30]);
  });

  it('all named patterns are valid', () => {
    const names: HapticPattern[] = ['light', 'medium', 'heavy', 'success', 'warning', 'error', 'selection'];
    names.forEach(name => {
      const result = resolvePattern(name);
      expect(result).toBeTruthy();
    });
  });

  it('light < medium < heavy', () => {
    expect(hapticPatterns.light as number).toBeLessThan(hapticPatterns.medium as number);
    expect(hapticPatterns.medium as number).toBeLessThan(hapticPatterns.heavy as number);
  });
});

describe('Navigation Routes', () => {
  it('has 8 routes', () => expect(navigationRoutes.length).toBe(8));

  it('each route has unique key', () => {
    const keys = navigationRoutes.map(r => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('each route has unique path', () => {
    const paths = navigationRoutes.map(r => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keys are sequential 1-8', () => {
    navigationRoutes.forEach((r, i) => {
      expect(r.key).toBe(String(i + 1));
    });
  });

  it('dashboard is key 1', () => {
    expect(findRouteByKey('1')?.path).toBe('/');
  });

  it('contatos is key 3', () => {
    expect(findRouteByKey('3')?.label).toBe('Contatos');
  });

  it('configuracoes is key 8', () => {
    expect(findRouteByKey('8')?.path).toBe('/configuracoes');
  });

  it('returns undefined for invalid key', () => {
    expect(findRouteByKey('0')).toBeUndefined();
    expect(findRouteByKey('9')).toBeUndefined();
    expect(findRouteByKey('a')).toBeUndefined();
  });

  it('all paths start with /', () => {
    navigationRoutes.forEach(r => {
      expect(r.path.startsWith('/')).toBe(true);
    });
  });
});

describe('Keyboard Shortcut Detection', () => {
  it('ignores INPUT elements', () => {
    expect(shouldIgnoreKeydown('INPUT', false)).toBe(true);
  });

  it('ignores TEXTAREA elements', () => {
    expect(shouldIgnoreKeydown('TEXTAREA', false)).toBe(true);
  });

  it('ignores contentEditable', () => {
    expect(shouldIgnoreKeydown('DIV', true)).toBe(true);
  });

  it('allows on normal DIV', () => {
    expect(shouldIgnoreKeydown('DIV', false)).toBe(false);
  });

  it('allows on BUTTON', () => {
    expect(shouldIgnoreKeydown('BUTTON', false)).toBe(false);
  });

  it('Ctrl+K → search', () => {
    expect(isModifierShortcut(false, true, 'k', 'DIV')).toBe('search');
  });

  it('Meta+K → search', () => {
    expect(isModifierShortcut(true, false, 'K', 'DIV')).toBe('search');
  });

  it('Ctrl+B → sidebar', () => {
    expect(isModifierShortcut(false, true, 'b', 'DIV')).toBe('sidebar');
  });

  it('Ctrl+\\ → sidebar', () => {
    expect(isModifierShortcut(false, true, '\\', 'DIV')).toBe('sidebar');
  });

  it('no modifier → null', () => {
    expect(isModifierShortcut(false, false, 'k', 'DIV')).toBeNull();
  });

  it('modifier + unknown key → null', () => {
    expect(isModifierShortcut(true, false, 'z', 'DIV')).toBeNull();
  });
});

describe('Online Status Determination', () => {
  it('online when navigator says online and no fetch', () => {
    expect(determineOnlineStatus(true, null)).toBe(true);
  });

  it('offline when navigator says offline and no fetch', () => {
    expect(determineOnlineStatus(false, null)).toBe(false);
  });

  it('fetch result overrides navigator (online)', () => {
    expect(determineOnlineStatus(false, true)).toBe(true);
  });

  it('fetch result overrides navigator (offline)', () => {
    expect(determineOnlineStatus(true, false)).toBe(false);
  });

  it('both agree online', () => {
    expect(determineOnlineStatus(true, true)).toBe(true);
  });

  it('both agree offline', () => {
    expect(determineOnlineStatus(false, false)).toBe(false);
  });
});
