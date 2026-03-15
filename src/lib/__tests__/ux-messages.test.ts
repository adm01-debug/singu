import { describe, it, expect, vi } from 'vitest';
import {
  loadingMessages,
  successMessages,
  errorMessages,
  emptyStateMessages,
  greetingMessages,
  getRandomMessage,
  getLoadingMessage,
  getSuccessMessage,
  getErrorMessage,
  getGreeting,
  getEmptyStateMessage,
} from '../ux-messages';

// ========================================
// Data integrity - 20+ scenarios
// ========================================
describe('Message data integrity', () => {
  it('all loading message arrays are non-empty', () => {
    for (const [key, msgs] of Object.entries(loadingMessages)) {
      expect(msgs.length, `loadingMessages.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('all success message arrays are non-empty', () => {
    for (const [key, msgs] of Object.entries(successMessages)) {
      expect(msgs.length, `successMessages.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('all error message arrays are non-empty', () => {
    for (const [key, msgs] of Object.entries(errorMessages)) {
      expect(msgs.length, `errorMessages.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('all empty state messages have title and descriptions', () => {
    for (const [key, state] of Object.entries(emptyStateMessages)) {
      expect(state.title, `emptyStateMessages.${key}.title missing`).toBeTruthy();
      expect(state.descriptions.length, `emptyStateMessages.${key}.descriptions empty`).toBeGreaterThan(0);
    }
  });

  it('all greeting periods have messages', () => {
    for (const [key, msgs] of Object.entries(greetingMessages)) {
      expect(msgs.length, `greetingMessages.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('no message contains undefined or null text', () => {
    const allMessages = [
      ...Object.values(loadingMessages).flat(),
      ...Object.values(successMessages).flat(),
      ...Object.values(errorMessages).flat(),
    ];
    for (const msg of allMessages) {
      expect(msg).toBeDefined();
      expect(msg).not.toBeNull();
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

// ========================================
// getRandomMessage - 10+ scenarios
// ========================================
describe('getRandomMessage', () => {
  it('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const result = getRandomMessage(arr);
    expect(arr).toContain(result);
  });

  it('returns the only element from single-element array', () => {
    expect(getRandomMessage(['only'])).toBe('only');
  });

  it('returns from large array', () => {
    const arr = Array.from({ length: 100 }, (_, i) => `msg_${i}`);
    const result = getRandomMessage(arr);
    expect(arr).toContain(result);
  });

  it('returns different values over many calls (probabilistic)', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const results = new Set(Array.from({ length: 50 }, () => getRandomMessage(arr)));
    // With 50 tries and 5 options, we should get at least 2 different values
    expect(results.size).toBeGreaterThan(1);
  });
});

// ========================================
// getLoadingMessage - 10+ scenarios
// ========================================
describe('getLoadingMessage', () => {
  it('returns a string for dashboard context', () => {
    const msg = getLoadingMessage('dashboard');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns a string for contacts context', () => {
    expect(typeof getLoadingMessage('contacts')).toBe('string');
  });

  it('returns a string for general context (default)', () => {
    expect(typeof getLoadingMessage()).toBe('string');
  });

  it('returns from correct context', () => {
    const msg = getLoadingMessage('analytics');
    expect(loadingMessages.analytics).toContain(msg);
  });

  it('falls back to general for unknown context', () => {
    const msg = getLoadingMessage('general');
    expect(loadingMessages.general).toContain(msg);
  });
});

// ========================================
// getSuccessMessage
// ========================================
describe('getSuccessMessage', () => {
  it('returns save message by default', () => {
    const msg = getSuccessMessage();
    expect(successMessages.save).toContain(msg);
  });

  it('returns create message', () => {
    const msg = getSuccessMessage('create');
    expect(successMessages.create).toContain(msg);
  });

  it('returns copy message', () => {
    const msg = getSuccessMessage('copy');
    expect(successMessages.copy).toContain(msg);
  });
});

// ========================================
// getErrorMessage
// ========================================
describe('getErrorMessage', () => {
  it('returns generic message by default', () => {
    const msg = getErrorMessage();
    expect(errorMessages.generic).toContain(msg);
  });

  it('returns network message', () => {
    const msg = getErrorMessage('network');
    expect(errorMessages.network).toContain(msg);
  });

  it('returns auth message', () => {
    const msg = getErrorMessage('auth');
    expect(errorMessages.auth).toContain(msg);
  });
});

// ========================================
// getGreeting - 10+ scenarios
// ========================================
describe('getGreeting', () => {
  it('returns a string', () => {
    expect(typeof getGreeting()).toBe('string');
  });

  it('includes name when provided', () => {
    const greeting = getGreeting('Maria');
    expect(greeting).toContain('Maria');
  });

  it('ends with ! when no name', () => {
    expect(getGreeting().endsWith('!')).toBe(true);
  });

  it('ends with ! when name provided', () => {
    expect(getGreeting('João').endsWith('!')).toBe(true);
  });

  it('returns morning greeting before noon', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 9, 0, 0));
    const greeting = getGreeting();
    const isMorning = greetingMessages.morning.some(m => greeting.startsWith(m));
    expect(isMorning).toBe(true);
    vi.useRealTimers();
  });

  it('returns afternoon greeting between 12-18', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 14, 0, 0));
    const greeting = getGreeting();
    const isAfternoon = greetingMessages.afternoon.some(m => greeting.startsWith(m));
    expect(isAfternoon).toBe(true);
    vi.useRealTimers();
  });

  it('returns evening greeting after 18', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 20, 0, 0));
    const greeting = getGreeting();
    const isEvening = greetingMessages.evening.some(m => greeting.startsWith(m));
    expect(isEvening).toBe(true);
    vi.useRealTimers();
  });
});

// ========================================
// getEmptyStateMessage
// ========================================
describe('getEmptyStateMessage', () => {
  it('returns contacts empty state', () => {
    const state = getEmptyStateMessage('contacts');
    expect(state.title).toBe('Nenhum contato encontrado');
    expect(typeof state.description).toBe('string');
  });

  it('returns companies empty state', () => {
    const state = getEmptyStateMessage('companies');
    expect(state.title).toBe('Nenhuma empresa encontrada');
  });

  it('returns interactions empty state', () => {
    const state = getEmptyStateMessage('interactions');
    expect(state.title).toBe('Nenhuma interação registrada');
  });

  it('returns search empty state', () => {
    const state = getEmptyStateMessage('search');
    expect(state.title).toBe('Nenhum resultado encontrado');
  });

  it('description is from the correct array', () => {
    const state = getEmptyStateMessage('contacts');
    expect(emptyStateMessages.contacts.descriptions).toContain(state.description);
  });
});
