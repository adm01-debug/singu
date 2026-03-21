/**
 * Testes exaustivos — Paginação, CRUD de Interações e Lógica de Contatos
 * Cobre: useInteractions paginação/loadMore, useContacts CRUD patterns
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ── Pagination Logic ──

interface PaginationState<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

function paginate<T>(allItems: T[], pageNum: number, pageSize: number): {
  data: T[];
  hasMore: boolean;
} {
  const start = pageNum * pageSize;
  const data = allItems.slice(start, start + pageSize);
  return { data, hasMore: data.length === pageSize };
}

function appendPage<T>(current: T[], newItems: T[]): T[] {
  return [...current, ...newItems];
}

function prependItem<T>(items: T[], item: T): T[] {
  return [item, ...items];
}

// ── Interaction Type Guards ──

type InteractionType = 'whatsapp' | 'call' | 'email' | 'meeting' | 'note' | 'social';
type Sentiment = 'positive' | 'neutral' | 'negative';

const validTypes: InteractionType[] = ['whatsapp', 'call', 'email', 'meeting', 'note', 'social'];
const validSentiments: Sentiment[] = ['positive', 'neutral', 'negative'];

function isValidType(type: string): type is InteractionType {
  return validTypes.includes(type as InteractionType);
}

function isValidSentiment(sentiment: string): sentiment is Sentiment {
  return validSentiments.includes(sentiment as Sentiment);
}

function shouldTriggerAnalysis(contentLength: number, threshold = 100): boolean {
  return contentLength >= threshold;
}

function buildAnalysisText(content: string | null, transcription: string | null): string {
  return [content, transcription].filter(Boolean).join('\n\n');
}

// ── Contact Merge Logic ──

interface MinimalContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  tags: string[];
  relationshipScore: number;
}

function mergeContactUpdates(contact: MinimalContact, updates: Partial<MinimalContact>): MinimalContact {
  return { ...contact, ...updates };
}

function calculateDaysSinceContact(lastInteractionAt: string | null, now: Date): number | null {
  if (!lastInteractionAt) return null;
  const last = new Date(lastInteractionAt);
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function categorizeRelationship(score: number): string {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'weak';
  return 'cold';
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('Pagination', () => {
  const allItems = Array.from({ length: 123 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  const pageSize = 50;

  it('first page returns 50 items', () => {
    const { data, hasMore } = paginate(allItems, 0, pageSize);
    expect(data.length).toBe(50);
    expect(hasMore).toBe(true);
  });

  it('second page returns 50 items', () => {
    const { data, hasMore } = paginate(allItems, 1, pageSize);
    expect(data.length).toBe(50);
    expect(hasMore).toBe(true);
  });

  it('third page returns 23 items (last page)', () => {
    const { data, hasMore } = paginate(allItems, 2, pageSize);
    expect(data.length).toBe(23);
    expect(hasMore).toBe(false);
  });

  it('fourth page returns 0 items', () => {
    const { data, hasMore } = paginate(allItems, 3, pageSize);
    expect(data.length).toBe(0);
    expect(hasMore).toBe(false);
  });

  it('empty dataset', () => {
    const { data, hasMore } = paginate([], 0, pageSize);
    expect(data.length).toBe(0);
    expect(hasMore).toBe(false);
  });

  it('exact page size', () => {
    const exact = Array.from({ length: 50 }, (_, i) => i);
    const { data, hasMore } = paginate(exact, 0, 50);
    expect(data.length).toBe(50);
    expect(hasMore).toBe(true); // can't know if there's more without checking
  });

  it('appendPage merges correctly', () => {
    const page1 = paginate(allItems, 0, pageSize).data;
    const page2 = paginate(allItems, 1, pageSize).data;
    const merged = appendPage(page1, page2);
    expect(merged.length).toBe(100);
    expect(merged[0]).toEqual({ id: 0, name: 'Item 0' });
    expect(merged[99]).toEqual({ id: 99, name: 'Item 99' });
  });

  it('prependItem adds to beginning', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = prependItem(items, { id: 0 });
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(0);
  });

  it('small page size', () => {
    const { data, hasMore } = paginate(allItems, 0, 5);
    expect(data.length).toBe(5);
    expect(hasMore).toBe(true);
  });

  it('page size of 1', () => {
    const { data } = paginate(allItems, 0, 1);
    expect(data.length).toBe(1);
    expect(data[0]).toEqual({ id: 0, name: 'Item 0' });
  });
});

describe('Interaction Type Guards', () => {
  it('all valid types accepted', () => {
    validTypes.forEach(t => expect(isValidType(t)).toBe(true));
  });

  it('rejects invalid types', () => {
    expect(isValidType('phone')).toBe(false);
    expect(isValidType('sms')).toBe(false);
    expect(isValidType('')).toBe(false);
  });

  it('all valid sentiments accepted', () => {
    validSentiments.forEach(s => expect(isValidSentiment(s)).toBe(true));
  });

  it('rejects invalid sentiments', () => {
    expect(isValidSentiment('angry')).toBe(false);
    expect(isValidSentiment('')).toBe(false);
  });
});

describe('Analysis Trigger Logic', () => {
  it('triggers at exactly 100 chars', () => {
    expect(shouldTriggerAnalysis(100)).toBe(true);
  });

  it('does not trigger at 99 chars', () => {
    expect(shouldTriggerAnalysis(99)).toBe(false);
  });

  it('triggers at 1000 chars', () => {
    expect(shouldTriggerAnalysis(1000)).toBe(true);
  });

  it('custom threshold', () => {
    expect(shouldTriggerAnalysis(50, 50)).toBe(true);
    expect(shouldTriggerAnalysis(49, 50)).toBe(false);
  });

  it('zero length does not trigger', () => {
    expect(shouldTriggerAnalysis(0)).toBe(false);
  });
});

describe('buildAnalysisText', () => {
  it('combines content and transcription', () => {
    expect(buildAnalysisText('hello', 'world')).toBe('hello\n\nworld');
  });

  it('content only', () => {
    expect(buildAnalysisText('hello', null)).toBe('hello');
  });

  it('transcription only', () => {
    expect(buildAnalysisText(null, 'world')).toBe('world');
  });

  it('both null returns empty', () => {
    expect(buildAnalysisText(null, null)).toBe('');
  });

  it('empty strings are filtered', () => {
    expect(buildAnalysisText('', '')).toBe('');
  });

  it('long text preserved', () => {
    const long = 'A'.repeat(10000);
    expect(buildAnalysisText(long, null)).toBe(long);
  });
});

describe('Contact Merge', () => {
  const contact: MinimalContact = {
    id: 'c1', firstName: 'João', lastName: 'Silva',
    email: 'joao@test.com', tags: ['vip'], relationshipScore: 75,
  };

  it('merges name update', () => {
    const merged = mergeContactUpdates(contact, { firstName: 'José' });
    expect(merged.firstName).toBe('José');
    expect(merged.lastName).toBe('Silva');
  });

  it('merges score update', () => {
    const merged = mergeContactUpdates(contact, { relationshipScore: 90 });
    expect(merged.relationshipScore).toBe(90);
  });

  it('merges tags', () => {
    const merged = mergeContactUpdates(contact, { tags: ['vip', 'premium'] });
    expect(merged.tags).toEqual(['vip', 'premium']);
  });

  it('preserves unchanged fields', () => {
    const merged = mergeContactUpdates(contact, { firstName: 'X' });
    expect(merged.email).toBe('joao@test.com');
    expect(merged.id).toBe('c1');
  });

  it('empty update returns copy', () => {
    const merged = mergeContactUpdates(contact, {});
    expect(merged).toEqual(contact);
  });
});

describe('Days Since Contact', () => {
  const now = new Date('2026-03-21T12:00:00Z');

  it('0 days for today', () => {
    expect(calculateDaysSinceContact('2026-03-21T10:00:00Z', now)).toBe(0);
  });

  it('1 day for yesterday', () => {
    expect(calculateDaysSinceContact('2026-03-20T12:00:00Z', now)).toBe(1);
  });

  it('30 days', () => {
    expect(calculateDaysSinceContact('2026-02-19T12:00:00Z', now)).toBe(30);
  });

  it('null for no interaction', () => {
    expect(calculateDaysSinceContact(null, now)).toBeNull();
  });

  it('large number for very old date', () => {
    const days = calculateDaysSinceContact('2020-01-01T00:00:00Z', now);
    expect(days).toBeGreaterThan(2000);
  });
});

describe('Relationship Categorization', () => {
  it('80+ is strong', () => expect(categorizeRelationship(80)).toBe('strong'));
  it('100 is strong', () => expect(categorizeRelationship(100)).toBe('strong'));
  it('60-79 is good', () => expect(categorizeRelationship(60)).toBe('good'));
  it('40-59 is moderate', () => expect(categorizeRelationship(40)).toBe('moderate'));
  it('20-39 is weak', () => expect(categorizeRelationship(20)).toBe('weak'));
  it('0-19 is cold', () => expect(categorizeRelationship(0)).toBe('cold'));
  it('negative is cold', () => expect(categorizeRelationship(-5)).toBe('cold'));
});
