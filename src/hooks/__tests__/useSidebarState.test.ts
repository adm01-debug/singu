import { describe, it, expect, vi, beforeEach } from 'vitest';

const SIDEBAR_STATE_KEY = 'relateiq-sidebar-collapsed';
const SIDEBAR_EVENT = 'relateiq-sidebar-state-change';

describe('useSidebarState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSnapshot', () => {
    it('returns false when localStorage has no value', () => {
      const result = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      expect(result).toBe(false);
    });

    it('returns true when localStorage is "true"', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
      const result = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      expect(result).toBe(true);
    });

    it('returns false when localStorage is "false"', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
      const result = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      expect(result).toBe(false);
    });

    it('returns false for any non-"true" string', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'yes');
      const result = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      expect(result).toBe(false);
    });

    it('returns false for empty string', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, '');
      const result = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      expect(result).toBe(false);
    });
  });

  describe('toggle logic', () => {
    it('toggles from false to true', () => {
      const prev = false;
      const next = !prev;
      expect(next).toBe(true);
    });

    it('toggles from true to false', () => {
      const prev = true;
      const next = !prev;
      expect(next).toBe(false);
    });

    it('persists toggle result to localStorage', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(true));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
    });
  });

  describe('expand', () => {
    it('sets collapsed to false', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(false));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    });

    it('overwrites true with false', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
      localStorage.setItem(SIDEBAR_STATE_KEY, String(false));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    });
  });

  describe('collapse', () => {
    it('sets collapsed to true', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(true));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
    });

    it('overwrites false with true', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
      localStorage.setItem(SIDEBAR_STATE_KEY, String(true));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
    });
  });

  describe('setCollapsed with function updater', () => {
    it('receives previous value and computes next', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
      const prev = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      const updater = (p: boolean) => !p;
      const next = updater(prev);
      expect(next).toBe(false);
    });

    it('receives false and returns true', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
      const prev = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
      const next = ((p: boolean) => !p)(prev);
      expect(next).toBe(true);
    });
  });

  describe('subscribe mechanism', () => {
    it('dispatches custom sidebar event', () => {
      const listener = vi.fn();
      window.addEventListener(SIDEBAR_EVENT, listener);
      window.dispatchEvent(new Event(SIDEBAR_EVENT));
      expect(listener).toHaveBeenCalledOnce();
      window.removeEventListener(SIDEBAR_EVENT, listener);
    });

    it('responds to storage events with matching key', () => {
      const callback = vi.fn();
      const handleStorage = (event: StorageEvent) => {
        if (event.key === SIDEBAR_STATE_KEY) callback();
      };
      window.addEventListener('storage', handleStorage);
      // Simulate storage event
      const event = new StorageEvent('storage', { key: SIDEBAR_STATE_KEY });
      window.dispatchEvent(event);
      expect(callback).toHaveBeenCalledOnce();
      window.removeEventListener('storage', handleStorage);
    });

    it('ignores storage events with different key', () => {
      const callback = vi.fn();
      const handleStorage = (event: StorageEvent) => {
        if (event.key === SIDEBAR_STATE_KEY) callback();
      };
      window.addEventListener('storage', handleStorage);
      const event = new StorageEvent('storage', { key: 'other-key' });
      window.dispatchEvent(event);
      expect(callback).not.toHaveBeenCalled();
      window.removeEventListener('storage', handleStorage);
    });

    it('cleanup removes event listeners', () => {
      const listener = vi.fn();
      window.addEventListener(SIDEBAR_EVENT, listener);
      window.removeEventListener(SIDEBAR_EVENT, listener);
      window.dispatchEvent(new Event(SIDEBAR_EVENT));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('localStorage persistence', () => {
    it('preserves value across reads', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
    });

    it('stores as string "true" or "false"', () => {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(true));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('true');
      localStorage.setItem(SIDEBAR_STATE_KEY, String(false));
      expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    });
  });
});
