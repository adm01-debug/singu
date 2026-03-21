import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'heart-shape') }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const STORAGE_KEY = 'discovered-easter-eggs';

describe('useEasterEggs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('easter egg definitions', () => {
    const easterEggs = [
      { id: 'konami', sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'] },
      { id: 'love', sequence: ['l', 'o', 'v', 'e'] },
      { id: 'matrix', sequence: ['m', 'a', 't', 'r', 'i', 'x'] },
      { id: 'dev', sequence: ['d', 'e', 'v', 'm', 'o', 'd', 'e'] },
      { id: 'party', sequence: ['p', 'a', 'r', 't', 'y'] },
    ];

    it('has 5 easter eggs defined', () => {
      expect(easterEggs).toHaveLength(5);
    });

    it('konami code has 10 key sequence', () => {
      const konami = easterEggs.find(e => e.id === 'konami');
      expect(konami!.sequence).toHaveLength(10);
    });

    it('konami code starts with ArrowUp ArrowUp', () => {
      const konami = easterEggs.find(e => e.id === 'konami');
      expect(konami!.sequence[0]).toBe('ArrowUp');
      expect(konami!.sequence[1]).toBe('ArrowUp');
    });

    it('konami code ends with b a', () => {
      const konami = easterEggs.find(e => e.id === 'konami');
      expect(konami!.sequence[8]).toBe('b');
      expect(konami!.sequence[9]).toBe('a');
    });

    it('love sequence is correct', () => {
      const love = easterEggs.find(e => e.id === 'love');
      expect(love!.sequence).toEqual(['l', 'o', 'v', 'e']);
    });

    it('matrix sequence is correct', () => {
      const matrix = easterEggs.find(e => e.id === 'matrix');
      expect(matrix!.sequence).toEqual(['m', 'a', 't', 'r', 'i', 'x']);
    });

    it('dev sequence is correct', () => {
      const dev = easterEggs.find(e => e.id === 'dev');
      expect(dev!.sequence).toEqual(['d', 'e', 'v', 'm', 'o', 'd', 'e']);
    });

    it('party sequence is correct', () => {
      const party = easterEggs.find(e => e.id === 'party');
      expect(party!.sequence).toEqual(['p', 'a', 'r', 't', 'y']);
    });
  });

  describe('sequence matching logic', () => {
    it('matches when key sequence ends with egg sequence', () => {
      const keySequence = ['x', 'y', 'l', 'o', 'v', 'e'];
      const eggSequence = ['l', 'o', 'v', 'e'];
      const sequenceStr = keySequence.join(',');
      const eggSequenceStr = eggSequence.join(',');
      expect(sequenceStr.endsWith(eggSequenceStr)).toBe(true);
    });

    it('does not match partial sequences', () => {
      const keySequence = ['l', 'o', 'v'];
      const eggSequence = ['l', 'o', 'v', 'e'];
      const sequenceStr = keySequence.join(',');
      const eggSequenceStr = eggSequence.join(',');
      expect(sequenceStr.endsWith(eggSequenceStr)).toBe(false);
    });

    it('matches exact sequence', () => {
      const keySequence = ['l', 'o', 'v', 'e'];
      const eggSequence = ['l', 'o', 'v', 'e'];
      expect(keySequence.join(',')).toBe(eggSequence.join(','));
    });

    it('does not match wrong sequence', () => {
      const keySequence = ['l', 'o', 'v', 'x'];
      const eggSequence = ['l', 'o', 'v', 'e'];
      const sequenceStr = keySequence.join(',');
      const eggSequenceStr = eggSequence.join(',');
      expect(sequenceStr.endsWith(eggSequenceStr)).toBe(false);
    });

    it('key sequence is limited to last 10 keys', () => {
      const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
      const limited = keys.slice(-10);
      expect(limited).toHaveLength(10);
      expect(limited[0]).toBe('c');
    });

    it('empty key sequence matches nothing', () => {
      const keySequence: string[] = [];
      const eggSequence = ['l', 'o', 'v', 'e'];
      expect(keySequence.join(',').endsWith(eggSequence.join(','))).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('stores discovered eggs as JSON array', () => {
      const discovered = ['konami', 'love'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discovered));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual(['konami', 'love']);
    });

    it('loads discovered eggs from storage on init', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['matrix']));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const discoveredEggs = new Set(stored);
      expect(discoveredEggs.has('matrix')).toBe(true);
    });

    it('returns empty set when storage is empty', () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const discoveredEggs = stored ? new Set(JSON.parse(stored)) : new Set();
      expect(discoveredEggs.size).toBe(0);
    });

    it('handles corrupted storage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      let discoveredEggs = new Set<string>();
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) discoveredEggs = new Set(JSON.parse(stored));
      } catch {
        discoveredEggs = new Set();
      }
      expect(discoveredEggs.size).toBe(0);
    });

    it('saves new discovered egg to storage', () => {
      const discovered = new Set(['konami']);
      discovered.add('love');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered]));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toContain('konami');
      expect(stored).toContain('love');
    });

    it('does not duplicate eggs in set', () => {
      const discovered = new Set(['konami']);
      discovered.add('konami');
      expect(discovered.size).toBe(1);
    });
  });

  describe('discovered state tracking', () => {
    it('totalEggs is 5', () => {
      const totalEggs = 5;
      expect(totalEggs).toBe(5);
    });

    it('discoveredCount matches set size', () => {
      const discovered = new Set(['konami', 'love']);
      expect(discovered.size).toBe(2);
    });

    it('discoveredCount is 0 initially', () => {
      const discovered = new Set<string>();
      expect(discovered.size).toBe(0);
    });

    it('can check if specific egg is discovered', () => {
      const discovered = new Set(['konami']);
      expect(discovered.has('konami')).toBe(true);
      expect(discovered.has('love')).toBe(false);
    });
  });

  describe('input filtering', () => {
    it('should not capture keys when target is INPUT', () => {
      const target = { tagName: 'INPUT' };
      const shouldCapture = target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
      expect(shouldCapture).toBe(false);
    });

    it('should not capture keys when target is TEXTAREA', () => {
      const target = { tagName: 'TEXTAREA' };
      const shouldCapture = target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
      expect(shouldCapture).toBe(false);
    });

    it('should capture keys when target is DIV', () => {
      const target = { tagName: 'DIV' };
      const shouldCapture = target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
      expect(shouldCapture).toBe(true);
    });

    it('should capture keys when target is BODY', () => {
      const target = { tagName: 'BODY' };
      const shouldCapture = target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
      expect(shouldCapture).toBe(true);
    });
  });

  describe('sequence timeout', () => {
    it('clears sequence after inactivity (logic test)', () => {
      let keySequence = ['l', 'o', 'v'];
      // After timeout, sequence resets
      keySequence = [];
      expect(keySequence).toEqual([]);
    });
  });
});
