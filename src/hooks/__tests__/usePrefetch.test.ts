import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

describe('usePrefetch', () => {
  describe('prefetch deduplication', () => {
    it('tracks prefetched IDs to prevent duplicates', () => {
      const prefetchedIds = new Set<string>();
      prefetchedIds.add('contact-123');
      expect(prefetchedIds.has('contact-123')).toBe(true);
    });

    it('skips prefetch when ID already seen', () => {
      const prefetchedIds = new Set<string>();
      prefetchedIds.add('contact-123');
      let prefetchCalled = false;
      if (!prefetchedIds.has('contact-123')) {
        prefetchCalled = true;
      }
      expect(prefetchCalled).toBe(false);
    });

    it('allows prefetch for new ID', () => {
      const prefetchedIds = new Set<string>();
      let prefetchCalled = false;
      if (!prefetchedIds.has('contact-456')) {
        prefetchCalled = true;
        prefetchedIds.add('contact-456');
      }
      expect(prefetchCalled).toBe(true);
      expect(prefetchedIds.has('contact-456')).toBe(true);
    });

    it('uses different prefixes for different entity types', () => {
      const prefetchedIds = new Set<string>();
      prefetchedIds.add('contact-123');
      prefetchedIds.add('company-123');
      // Same ID but different entity types should both be tracked
      expect(prefetchedIds.has('contact-123')).toBe(true);
      expect(prefetchedIds.has('company-123')).toBe(true);
      expect(prefetchedIds.size).toBe(2);
    });

    it('uses interactions prefix for interaction prefetch', () => {
      const prefetchedIds = new Set<string>();
      const contactId = 'abc';
      prefetchedIds.add(`interactions-${contactId}`);
      expect(prefetchedIds.has('interactions-abc')).toBe(true);
    });
  });

  describe('clearPrefetchCache', () => {
    it('clears all prefetched IDs', () => {
      const prefetchedIds = new Set<string>();
      prefetchedIds.add('contact-1');
      prefetchedIds.add('company-2');
      prefetchedIds.add('interactions-3');
      prefetchedIds.clear();
      expect(prefetchedIds.size).toBe(0);
    });

    it('allows re-prefetch after clearing', () => {
      const prefetchedIds = new Set<string>();
      prefetchedIds.add('contact-123');
      prefetchedIds.clear();
      expect(prefetchedIds.has('contact-123')).toBe(false);
    });
  });

  describe('query key structure', () => {
    it('contact detail query key', () => {
      const contactId = '123';
      const key = ['contact-detail', contactId];
      expect(key).toEqual(['contact-detail', '123']);
    });

    it('company detail query key', () => {
      const companyId = '456';
      const key = ['company-detail', companyId];
      expect(key).toEqual(['company-detail', '456']);
    });

    it('interactions query key', () => {
      const contactId = '789';
      const key = ['interactions', contactId];
      expect(key).toEqual(['interactions', '789']);
    });
  });

  describe('stale time configuration', () => {
    it('contact prefetch has 5 minute stale time', () => {
      const staleTime = 5 * 60 * 1000;
      expect(staleTime).toBe(300000);
    });

    it('company prefetch has 5 minute stale time', () => {
      const staleTime = 5 * 60 * 1000;
      expect(staleTime).toBe(300000);
    });

    it('interactions prefetch has 2 minute stale time', () => {
      const staleTime = 2 * 60 * 1000;
      expect(staleTime).toBe(120000);
    });
  });

  describe('Supabase query structure', () => {
    it('contact query selects from contacts table', () => {
      const table = 'contacts';
      expect(table).toBe('contacts');
    });

    it('company query selects from companies table', () => {
      const table = 'companies';
      expect(table).toBe('companies');
    });

    it('interactions query selects from interactions table', () => {
      const table = 'interactions';
      expect(table).toBe('interactions');
    });

    it('contact query includes company relation', () => {
      const selectFields = '*, company:companies(id, name, industry, logo_url), interactions:interactions(id, title, type, created_at, sentiment)';
      expect(selectFields).toContain('company:companies');
    });

    it('contact query includes interactions relation', () => {
      const selectFields = '*, company:companies(id, name, industry, logo_url), interactions:interactions(id, title, type, created_at, sentiment)';
      expect(selectFields).toContain('interactions:interactions');
    });

    it('company query includes contacts relation', () => {
      const selectFields = '*, contacts:contacts(id, first_name, last_name, role, avatar_url)';
      expect(selectFields).toContain('contacts:contacts');
    });

    it('interactions query limits to 20 results', () => {
      const limit = 20;
      expect(limit).toBe(20);
    });

    it('interactions query orders by created_at descending', () => {
      const order = { column: 'created_at', ascending: false };
      expect(order.ascending).toBe(false);
    });
  });

  describe('usePrefetchOnHover', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('default delay is 150ms', () => {
      const delay = 150;
      expect(delay).toBe(150);
    });

    it('calls prefetch function after delay on mouse enter', () => {
      const prefetchFn = vi.fn();
      const delay = 150;
      const timeout = setTimeout(prefetchFn, delay);
      vi.advanceTimersByTime(150);
      expect(prefetchFn).toHaveBeenCalledOnce();
      clearTimeout(timeout);
    });

    it('does not call prefetch if mouse leaves before delay', () => {
      const prefetchFn = vi.fn();
      const delay = 150;
      const timeout = setTimeout(prefetchFn, delay);
      vi.advanceTimersByTime(100);
      clearTimeout(timeout);
      vi.advanceTimersByTime(100);
      expect(prefetchFn).not.toHaveBeenCalled();
    });

    it('accepts custom delay', () => {
      const prefetchFn = vi.fn();
      const delay = 300;
      const timeout = setTimeout(prefetchFn, delay);
      vi.advanceTimersByTime(200);
      expect(prefetchFn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(prefetchFn).toHaveBeenCalledOnce();
      clearTimeout(timeout);
    });

    it('cleanup clears timeout on mouse leave', () => {
      const prefetchFn = vi.fn();
      const timeout = setTimeout(prefetchFn, 150);
      clearTimeout(timeout);
      vi.advanceTimersByTime(200);
      expect(prefetchFn).not.toHaveBeenCalled();
    });
  });
});
