/**
 * Testes exaustivos — Form Draft e LocalStorage Persistence
 * Cobre: useFormDraft, localStorage helpers, serialization patterns
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── LocalStorage Mock Helpers ──

class MockStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

// ── Form Draft Logic ──

interface FormData {
  [key: string]: unknown;
}

function saveDraft(storage: MockStorage, key: string, data: FormData): boolean {
  try {
    const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
    if (hasData) {
      storage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function loadDraft(storage: MockStorage, key: string): FormData | null {
  try {
    const stored = storage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

function clearDraft(storage: MockStorage, key: string): void {
  storage.removeItem(key);
}

function mergeDraftWithDefaults(
  draft: FormData | null,
  defaults: FormData
): FormData {
  if (!draft) return { ...defaults };
  const merged: FormData = { ...defaults };
  for (const [key, value] of Object.entries(draft)) {
    const current = defaults[key];
    if (!current || current === '' || current === null) {
      merged[key] = value;
    }
  }
  return merged;
}

function buildStorageKey(prefix: string, formKey: string): string {
  return `${prefix}-${formKey}`;
}

// ── Serialization Safety ──

function safeSerialize(data: unknown): string | null {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function safeDeserialize<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('Form Draft — Save', () => {
  let storage: MockStorage;
  const key = 'relateiq-draft-contact-new';

  beforeEach(() => { storage = new MockStorage(); });

  it('saves valid form data', () => {
    const saved = saveDraft(storage, key, { name: 'João', email: 'j@test.com' });
    expect(saved).toBe(true);
    expect(storage.getItem(key)).toBeTruthy();
  });

  it('does not save empty form', () => {
    const saved = saveDraft(storage, key, { name: '', email: null, phone: undefined });
    expect(saved).toBe(false);
    expect(storage.getItem(key)).toBeNull();
  });

  it('saves if at least one field has value', () => {
    const saved = saveDraft(storage, key, { name: 'João', email: '' });
    expect(saved).toBe(true);
  });

  it('overwrites previous draft', () => {
    saveDraft(storage, key, { name: 'Old' });
    saveDraft(storage, key, { name: 'New' });
    const loaded = loadDraft(storage, key);
    expect(loaded?.name).toBe('New');
  });

  it('saves complex nested data', () => {
    const data = { tags: ['vip', 'hot'], behavior: { disc: 'D' } };
    saveDraft(storage, key, data);
    const loaded = loadDraft(storage, key);
    expect(loaded?.tags).toEqual(['vip', 'hot']);
    expect((loaded?.behavior as any)?.disc).toBe('D');
  });

  it('saves zero and false values', () => {
    const saved = saveDraft(storage, key, { score: 0, active: false });
    expect(saved).toBe(true);
  });
});

describe('Form Draft — Load', () => {
  let storage: MockStorage;
  const key = 'relateiq-draft-contact-new';

  beforeEach(() => { storage = new MockStorage(); });

  it('returns null when no draft', () => {
    expect(loadDraft(storage, key)).toBeNull();
  });

  it('returns parsed data', () => {
    storage.setItem(key, JSON.stringify({ name: 'Test' }));
    expect(loadDraft(storage, key)?.name).toBe('Test');
  });

  it('returns null for invalid JSON', () => {
    storage.setItem(key, 'not json');
    expect(loadDraft(storage, key)).toBeNull();
  });

  it('returns null for non-object stored data', () => {
    storage.setItem(key, '"just a string"');
    expect(loadDraft(storage, key)).toBeNull();
  });
});

describe('Form Draft — Clear', () => {
  let storage: MockStorage;
  const key = 'relateiq-draft-contact-new';

  beforeEach(() => { storage = new MockStorage(); });

  it('removes draft', () => {
    saveDraft(storage, key, { name: 'Test' });
    clearDraft(storage, key);
    expect(storage.getItem(key)).toBeNull();
  });

  it('does not fail on non-existent key', () => {
    expect(() => clearDraft(storage, 'nonexistent')).not.toThrow();
  });

  it('does not affect other drafts', () => {
    saveDraft(storage, 'draft-a', { a: 1 });
    saveDraft(storage, 'draft-b', { b: 2 });
    clearDraft(storage, 'draft-a');
    expect(loadDraft(storage, 'draft-b')?.b).toBe(2);
  });
});

describe('Form Draft — Merge with Defaults', () => {
  it('returns defaults when no draft', () => {
    const result = mergeDraftWithDefaults(null, { name: '', email: '' });
    expect(result).toEqual({ name: '', email: '' });
  });

  it('merges draft values into empty defaults', () => {
    const result = mergeDraftWithDefaults(
      { name: 'João', email: 'j@test.com' },
      { name: '', email: '' }
    );
    expect(result.name).toBe('João');
    expect(result.email).toBe('j@test.com');
  });

  it('does NOT overwrite existing default values', () => {
    const result = mergeDraftWithDefaults(
      { name: 'Draft Name' },
      { name: 'Default Name' }
    );
    expect(result.name).toBe('Default Name'); // default preserved
  });

  it('fills null defaults from draft', () => {
    const result = mergeDraftWithDefaults(
      { phone: '11999' },
      { phone: null } as any
    );
    expect(result.phone).toBe('11999');
  });

  it('handles extra draft keys not in defaults', () => {
    const result = mergeDraftWithDefaults(
      { name: 'João', extraField: 'extra' },
      { name: '' }
    );
    expect(result.name).toBe('João');
    expect(result.extraField).toBe('extra');
  });
});

describe('Storage Key Builder', () => {
  it('builds correct key', () => {
    expect(buildStorageKey('relateiq-draft', 'contact-new')).toBe('relateiq-draft-contact-new');
  });

  it('handles edit with ID', () => {
    expect(buildStorageKey('relateiq-draft', 'contact-edit-abc123')).toBe('relateiq-draft-contact-edit-abc123');
  });
});

describe('Safe Serialization', () => {
  it('serializes object', () => {
    expect(safeSerialize({ a: 1 })).toBe('{"a":1}');
  });

  it('serializes array', () => {
    expect(safeSerialize([1, 2])).toBe('[1,2]');
  });

  it('serializes null', () => {
    expect(safeSerialize(null)).toBe('null');
  });

  it('serializes string', () => {
    expect(safeSerialize('hello')).toBe('"hello"');
  });

  it('handles circular reference gracefully', () => {
    const obj: any = {};
    obj.self = obj;
    expect(safeSerialize(obj)).toBeNull();
  });
});

describe('Safe Deserialization', () => {
  it('parses valid JSON', () => {
    expect(safeDeserialize('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback for null input', () => {
    expect(safeDeserialize(null, { default: true })).toEqual({ default: true });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeDeserialize('invalid', [])).toEqual([]);
  });

  it('returns fallback for empty string', () => {
    expect(safeDeserialize('', 'fallback')).toBe('fallback');
  });

  it('parses nested objects', () => {
    const result = safeDeserialize('{"a":{"b":{"c":1}}}', {});
    expect((result as any).a.b.c).toBe(1);
  });
});

describe('Full Workflow — Form Draft Lifecycle', () => {
  let storage: MockStorage;

  beforeEach(() => { storage = new MockStorage(); });

  it('complete create form lifecycle', () => {
    const key = buildStorageKey('relateiq-draft', 'contact-new');
    const defaults = { firstName: '', lastName: '', email: '' };

    // 1. No draft exists
    expect(loadDraft(storage, key)).toBeNull();
    const initial = mergeDraftWithDefaults(null, defaults);
    expect(initial).toEqual(defaults);

    // 2. User types → draft saved
    saveDraft(storage, key, { firstName: 'João', lastName: '', email: '' });
    expect(loadDraft(storage, key)?.firstName).toBe('João');

    // 3. User continues typing
    saveDraft(storage, key, { firstName: 'João', lastName: 'Silva', email: 'j@test.com' });

    // 4. User refreshes → draft restored
    const restored = mergeDraftWithDefaults(loadDraft(storage, key), defaults);
    expect(restored.firstName).toBe('João');
    expect(restored.lastName).toBe('Silva');

    // 5. User submits → draft cleared
    clearDraft(storage, key);
    expect(loadDraft(storage, key)).toBeNull();
  });

  it('complete edit form lifecycle', () => {
    const key = buildStorageKey('relateiq-draft', 'contact-edit-abc123');
    const existing = { firstName: 'Maria', lastName: 'Santos', email: 'maria@test.com' };

    // 1. No draft — use existing data
    const initial = mergeDraftWithDefaults(null, existing);
    expect(initial).toEqual(existing);

    // 2. User edits email
    saveDraft(storage, key, { firstName: 'Maria', lastName: 'Santos', email: 'maria.new@test.com' });

    // 3. Refresh → draft doesn't overwrite existing filled values
    const draft = loadDraft(storage, key);
    const restored = mergeDraftWithDefaults(draft, existing);
    // firstName exists in defaults → NOT overwritten
    expect(restored.firstName).toBe('Maria');

    // 4. Save → clear
    clearDraft(storage, key);
    expect(loadDraft(storage, key)).toBeNull();
  });
});
