/**
 * Testes exaustivos — Feature Discovery e Recently Viewed
 * Cobre: useFeatureDiscovery, useRecentlyViewed (lógica pura)
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ── Feature Discovery Logic ──

interface FeatureFlag { id: string; seenAt: string; }

function hasSeenFeature(seen: FeatureFlag[], featureId: string): boolean {
  return seen.some(f => f.id === featureId);
}

function markAsSeen(seen: FeatureFlag[], featureId: string): FeatureFlag[] {
  if (seen.some(f => f.id === featureId)) return seen;
  return [...seen, { id: featureId, seenAt: new Date().toISOString() }];
}

function resetAll(): FeatureFlag[] {
  return [];
}

// ── Recently Viewed Logic ──

interface RecentlyViewedItem {
  id: string;
  type: 'contact' | 'company';
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  viewedAt: string;
}

const MAX_ITEMS = 10;

function trackView(items: RecentlyViewedItem[], item: Omit<RecentlyViewedItem, 'viewedAt'>): RecentlyViewedItem[] {
  const filtered = items.filter(i => !(i.id === item.id && i.type === item.type));
  return [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
}

function filterByType(items: RecentlyViewedItem[], type?: 'contact' | 'company'): RecentlyViewedItem[] {
  return type ? items.filter(i => i.type === type) : items;
}

// ══════════════════════════════
// TESTS
// ══════════════════════════════

describe('Feature Discovery', () => {
  let seen: FeatureFlag[];
  beforeEach(() => { seen = []; });

  it('starts with no features seen', () => {
    expect(hasSeenFeature(seen, 'disc-module')).toBe(false);
  });

  it('marks feature as seen', () => {
    seen = markAsSeen(seen, 'disc-module');
    expect(hasSeenFeature(seen, 'disc-module')).toBe(true);
  });

  it('does not duplicate on double mark', () => {
    seen = markAsSeen(seen, 'nlp-module');
    seen = markAsSeen(seen, 'nlp-module');
    expect(seen.filter(f => f.id === 'nlp-module').length).toBe(1);
  });

  it('tracks multiple features independently', () => {
    seen = markAsSeen(seen, 'disc');
    seen = markAsSeen(seen, 'nlp');
    seen = markAsSeen(seen, 'neuro');
    expect(hasSeenFeature(seen, 'disc')).toBe(true);
    expect(hasSeenFeature(seen, 'nlp')).toBe(true);
    expect(hasSeenFeature(seen, 'neuro')).toBe(true);
    expect(hasSeenFeature(seen, 'unknown')).toBe(false);
  });

  it('resetAll clears everything', () => {
    seen = markAsSeen(seen, 'a');
    seen = markAsSeen(seen, 'b');
    seen = resetAll();
    expect(seen.length).toBe(0);
    expect(hasSeenFeature(seen, 'a')).toBe(false);
  });

  it('stores timestamp', () => {
    seen = markAsSeen(seen, 'test');
    expect(seen[0].seenAt).toBeTruthy();
    expect(new Date(seen[0].seenAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('handles 50 features', () => {
    for (let i = 0; i < 50; i++) seen = markAsSeen(seen, `feature-${i}`);
    expect(seen.length).toBe(50);
    expect(hasSeenFeature(seen, 'feature-0')).toBe(true);
    expect(hasSeenFeature(seen, 'feature-49')).toBe(true);
  });
});

describe('Recently Viewed — trackView', () => {
  let items: RecentlyViewedItem[];
  beforeEach(() => { items = []; });

  it('adds first item', () => {
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' });
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('João');
  });

  it('prepends new item (most recent first)', () => {
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' });
    items = trackView(items, { id: 'c2', type: 'contact', name: 'Maria' });
    expect(items[0].name).toBe('Maria');
    expect(items[1].name).toBe('João');
  });

  it('moves re-viewed item to top', () => {
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' });
    items = trackView(items, { id: 'c2', type: 'contact', name: 'Maria' });
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' }); // re-view
    expect(items[0].name).toBe('João');
    expect(items.length).toBe(2);
  });

  it('enforces max 10 items', () => {
    for (let i = 0; i < 15; i++) {
      items = trackView(items, { id: `c${i}`, type: 'contact', name: `Contact ${i}` });
    }
    expect(items.length).toBe(10);
    expect(items[0].name).toBe('Contact 14'); // most recent
  });

  it('same ID different type treated as different items', () => {
    items = trackView(items, { id: 'x1', type: 'contact', name: 'Person' });
    items = trackView(items, { id: 'x1', type: 'company', name: 'Company' });
    expect(items.length).toBe(2);
  });

  it('same ID same type replaces (deduplicates)', () => {
    items = trackView(items, { id: 'c1', type: 'contact', name: 'Old Name' });
    items = trackView(items, { id: 'c1', type: 'contact', name: 'New Name' });
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('New Name');
  });

  it('preserves optional fields', () => {
    items = trackView(items, {
      id: 'c1', type: 'contact', name: 'João',
      subtitle: 'CEO', avatarUrl: 'http://img.com/a.jpg',
    });
    expect(items[0].subtitle).toBe('CEO');
    expect(items[0].avatarUrl).toBe('http://img.com/a.jpg');
  });

  it('adds viewedAt timestamp', () => {
    items = trackView(items, { id: 'c1', type: 'contact', name: 'Test' });
    expect(items[0].viewedAt).toBeTruthy();
  });
});

describe('Recently Viewed — filterByType', () => {
  const mixed: RecentlyViewedItem[] = [
    { id: 'c1', type: 'contact', name: 'João', viewedAt: '2026-01-01' },
    { id: 'co1', type: 'company', name: 'TechCorp', viewedAt: '2026-01-01' },
    { id: 'c2', type: 'contact', name: 'Maria', viewedAt: '2026-01-01' },
    { id: 'co2', type: 'company', name: 'SalesCo', viewedAt: '2026-01-01' },
    { id: 'c3', type: 'contact', name: 'Pedro', viewedAt: '2026-01-01' },
  ];

  it('returns all without filter', () => {
    expect(filterByType(mixed).length).toBe(5);
  });

  it('filters contacts only', () => {
    const contacts = filterByType(mixed, 'contact');
    expect(contacts.length).toBe(3);
    expect(contacts.every(i => i.type === 'contact')).toBe(true);
  });

  it('filters companies only', () => {
    const companies = filterByType(mixed, 'company');
    expect(companies.length).toBe(2);
    expect(companies.every(i => i.type === 'company')).toBe(true);
  });

  it('returns empty for type with no items', () => {
    const contactsOnly: RecentlyViewedItem[] = [
      { id: 'c1', type: 'contact', name: 'A', viewedAt: '2026-01-01' },
    ];
    expect(filterByType(contactsOnly, 'company')).toEqual([]);
  });

  it('handles empty list', () => {
    expect(filterByType([], 'contact')).toEqual([]);
  });
});

describe('Edge Cases — Combined Workflow', () => {
  it('full feature discovery workflow', () => {
    let seen: FeatureFlag[] = [];
    
    // New user - nothing seen
    expect(hasSeenFeature(seen, 'dashboard')).toBe(false);
    expect(hasSeenFeature(seen, 'contacts')).toBe(false);
    
    // User navigates
    seen = markAsSeen(seen, 'dashboard');
    expect(hasSeenFeature(seen, 'dashboard')).toBe(true);
    expect(hasSeenFeature(seen, 'contacts')).toBe(false);
    
    // User explores more
    seen = markAsSeen(seen, 'contacts');
    seen = markAsSeen(seen, 'disc-analysis');
    expect(seen.length).toBe(3);
    
    // Reset for new tour
    seen = resetAll();
    expect(seen.length).toBe(0);
    expect(hasSeenFeature(seen, 'dashboard')).toBe(false);
  });

  it('full recently viewed workflow', () => {
    let items: RecentlyViewedItem[] = [];
    
    // User views contacts
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' });
    items = trackView(items, { id: 'c2', type: 'contact', name: 'Maria' });
    items = trackView(items, { id: 'co1', type: 'company', name: 'TechCorp' });
    
    expect(items.length).toBe(3);
    expect(items[0].name).toBe('TechCorp'); // most recent
    
    // Filter by type
    expect(filterByType(items, 'contact').length).toBe(2);
    expect(filterByType(items, 'company').length).toBe(1);
    
    // Re-view old contact → moves to top
    items = trackView(items, { id: 'c1', type: 'contact', name: 'João' });
    expect(items[0].name).toBe('João');
    expect(items.length).toBe(3); // no duplicate
    
    // Overflow test
    for (let i = 0; i < 20; i++) {
      items = trackView(items, { id: `new${i}`, type: 'contact', name: `New ${i}` });
    }
    expect(items.length).toBe(10);
  });
});
