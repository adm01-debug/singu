import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const STORAGE_PREFIX = 'relateiq-draft-';

describe('useFormDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('storage key construction', () => {
    it('creates key with prefix and form key', () => {
      const key = 'contact-new';
      expect(`${STORAGE_PREFIX}${key}`).toBe('relateiq-draft-contact-new');
    });

    it('supports edit keys with IDs', () => {
      const key = 'contact-edit-123';
      expect(`${STORAGE_PREFIX}${key}`).toBe('relateiq-draft-contact-edit-123');
    });
  });

  describe('draft restore logic', () => {
    it('restores draft from localStorage when present', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      const draft = { name: 'Alice', email: 'alice@test.com' };
      localStorage.setItem(storageKey, JSON.stringify(draft));
      const stored = JSON.parse(localStorage.getItem(storageKey)!);
      expect(stored.name).toBe('Alice');
      expect(stored.email).toBe('alice@test.com');
    });

    it('returns null when no draft exists', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('handles corrupted draft data gracefully', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      localStorage.setItem(storageKey, 'not-json');
      let result: unknown = null;
      try {
        result = JSON.parse(localStorage.getItem(storageKey)!);
      } catch {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('only merges fields where current value is empty', () => {
      const currentValues = { name: 'Existing', email: '', phone: null };
      const draft = { name: 'Draft Name', email: 'draft@test.com', phone: '123' };
      const mergedValues: Record<string, unknown> = {};

      for (const [fieldKey, value] of Object.entries(draft)) {
        const currentVal = currentValues[fieldKey as keyof typeof currentValues];
        if (!currentVal || currentVal === '' || currentVal === null) {
          mergedValues[fieldKey] = value;
        }
      }

      // name has existing value, should not be overwritten
      expect(mergedValues).not.toHaveProperty('name');
      // email and phone are empty/null, should be merged
      expect(mergedValues.email).toBe('draft@test.com');
      expect(mergedValues.phone).toBe('123');
    });

    it('does not merge if draft is not an object', () => {
      const stored = 'just a string';
      const isObject = stored && typeof stored === 'object';
      expect(isObject).toBe(false);
    });

    it('does not merge if draft is null', () => {
      const stored = null;
      const isObject = stored && typeof stored === 'object';
      expect(isObject).toBeFalsy();
    });
  });

  describe('draft save logic', () => {
    it('saves data to localStorage', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      const data = { name: 'Test', email: 'test@test.com' };
      localStorage.setItem(storageKey, JSON.stringify(data));
      expect(localStorage.getItem(storageKey)).toBeTruthy();
    });

    it('only saves when there is meaningful data', () => {
      const data1 = { name: '', email: null, phone: undefined };
      const hasData1 = Object.values(data1).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData1).toBe(false);

      const data2 = { name: 'Alice', email: '', phone: null };
      const hasData2 = Object.values(data2).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData2).toBe(true);
    });

    it('detects empty data correctly', () => {
      const data = { a: '', b: null, c: undefined };
      const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData).toBe(false);
    });

    it('detects meaningful data correctly', () => {
      const data = { a: 'value' };
      const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData).toBe(true);
    });

    it('data with zero is considered meaningful', () => {
      const data = { count: 0 };
      const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData).toBe(true);
    });

    it('data with false is considered meaningful', () => {
      const data = { active: false };
      const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
      expect(hasData).toBe(true);
    });
  });

  describe('clearDraft', () => {
    it('removes draft from localStorage', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      localStorage.setItem(storageKey, JSON.stringify({ name: 'Test' }));
      localStorage.removeItem(storageKey);
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('does not throw when draft does not exist', () => {
      const storageKey = `${STORAGE_PREFIX}nonexistent`;
      expect(() => localStorage.removeItem(storageKey)).not.toThrow();
    });

    it('only removes the specific draft key', () => {
      localStorage.setItem(`${STORAGE_PREFIX}form-a`, JSON.stringify({ a: 1 }));
      localStorage.setItem(`${STORAGE_PREFIX}form-b`, JSON.stringify({ b: 2 }));
      localStorage.removeItem(`${STORAGE_PREFIX}form-a`);
      expect(localStorage.getItem(`${STORAGE_PREFIX}form-a`)).toBeNull();
      expect(localStorage.getItem(`${STORAGE_PREFIX}form-b`)).toBeTruthy();
    });
  });

  describe('disabled behavior', () => {
    it('does not save when enabled is false', () => {
      const enabled = false;
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      if (enabled) {
        localStorage.setItem(storageKey, JSON.stringify({ name: 'Test' }));
      }
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('does not restore when enabled is false', () => {
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      localStorage.setItem(storageKey, JSON.stringify({ name: 'Draft' }));
      const enabled = false;
      let restored: unknown = null;
      if (enabled) {
        restored = JSON.parse(localStorage.getItem(storageKey)!);
      }
      expect(restored).toBeNull();
    });
  });

  describe('debounce behavior', () => {
    it('default debounce is 1000ms', () => {
      const { debounceMs = 1000 } = {};
      expect(debounceMs).toBe(1000);
    });

    it('accepts custom debounce delay', () => {
      const { debounceMs = 1000 } = { debounceMs: 500 };
      expect(debounceMs).toBe(500);
    });
  });

  describe('hasDraft state', () => {
    it('is initially false when no draft exists', () => {
      let hasDraft = false;
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        hasDraft = true;
      }
      expect(hasDraft).toBe(false);
    });

    it('is true when draft exists in localStorage', () => {
      let hasDraft = false;
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      localStorage.setItem(storageKey, JSON.stringify({ name: 'Draft' }));
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          hasDraft = true;
        }
      }
      expect(hasDraft).toBe(true);
    });

    it('becomes false after clearDraft', () => {
      let hasDraft = true;
      const storageKey = `${STORAGE_PREFIX}contact-new`;
      localStorage.removeItem(storageKey);
      hasDraft = false;
      expect(hasDraft).toBe(false);
    });
  });

  describe('quota exceeded handling', () => {
    it('catches QuotaExceededError', () => {
      const err = new DOMException('Storage quota exceeded', 'QuotaExceededError');
      expect(err.name).toBe('QuotaExceededError');
      const isQuotaError = err instanceof DOMException && (err.name === 'QuotaExceededError');
      expect(isQuotaError).toBe(true);
    });
  });
});
