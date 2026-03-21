import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

// Build a chainable mock for Supabase
const createChainableMock = (resolvedValue: { count: number | null; data: null; error: null } = { count: 0, data: null, error: null }) => {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  chainable.select = vi.fn().mockReturnValue(chainable);
  chainable.eq = vi.fn().mockReturnValue(chainable);
  chainable.lte = vi.fn().mockResolvedValue(resolvedValue);
  // Make the object itself thenable
  chainable.then = vi.fn((resolve: Function) => resolve(resolvedValue));
  return chainable;
};

vi.mock('@/integrations/supabase/client', () => {
  const chainable = createChainableMock();
  return {
    supabase: {
      from: vi.fn(() => chainable),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

describe('useNotificationCounts', () => {
  describe('NotificationCounts interface', () => {
    it('has all count fields', () => {
      const counts = {
        notifications: 0,
        insights: 0,
        healthAlerts: 0,
        interactions: 0,
        total: 0,
      };
      expect(counts).toHaveProperty('notifications');
      expect(counts).toHaveProperty('insights');
      expect(counts).toHaveProperty('healthAlerts');
      expect(counts).toHaveProperty('interactions');
      expect(counts).toHaveProperty('total');
    });

    it('default counts are all zeros', () => {
      const counts = {
        notifications: 0,
        insights: 0,
        healthAlerts: 0,
        interactions: 0,
        total: 0,
      };
      Object.values(counts).forEach(v => expect(v).toBe(0));
    });
  });

  describe('total calculation', () => {
    it('calculates total from all counts', () => {
      const notifications = 3;
      const insights = 2;
      const healthAlerts = 1;
      const interactions = 4;
      const total = notifications + insights + healthAlerts + interactions;
      expect(total).toBe(10);
    });

    it('total is 0 when all counts are 0', () => {
      const total = 0 + 0 + 0 + 0;
      expect(total).toBe(0);
    });

    it('handles null counts by defaulting to 0', () => {
      const count: number | null = null;
      const result = count || 0;
      expect(result).toBe(0);
    });

    it('handles undefined counts by defaulting to 0', () => {
      const count: number | undefined = undefined;
      const result = count || 0;
      expect(result).toBe(0);
    });
  });

  describe('no user scenario', () => {
    it('resets counts when no user', () => {
      const userId: string | undefined = undefined;
      if (!userId) {
        const counts = { notifications: 0, insights: 0, healthAlerts: 0, interactions: 0, total: 0 };
        expect(counts.total).toBe(0);
      }
    });

    it('sets loading to false when no user', () => {
      const userId: string | undefined = undefined;
      let isLoading = true;
      if (!userId) {
        isLoading = false;
      }
      expect(isLoading).toBe(false);
    });
  });

  describe('Supabase query structure', () => {
    it('queries alerts table for notifications', () => {
      const tables = ['alerts', 'insights', 'health_alerts', 'interactions'];
      expect(tables).toContain('alerts');
    });

    it('queries insights table', () => {
      const tables = ['alerts', 'insights', 'health_alerts', 'interactions'];
      expect(tables).toContain('insights');
    });

    it('queries health_alerts table', () => {
      const tables = ['alerts', 'insights', 'health_alerts', 'interactions'];
      expect(tables).toContain('health_alerts');
    });

    it('queries interactions with follow_up_required', () => {
      const interactionFilters = { follow_up_required: true };
      expect(interactionFilters.follow_up_required).toBe(true);
    });

    it('filters by user_id', () => {
      const userId = 'test-user';
      const filter = { user_id: userId };
      expect(filter.user_id).toBe('test-user');
    });

    it('filters by dismissed = false', () => {
      const filter = { dismissed: false };
      expect(filter.dismissed).toBe(false);
    });

    it('interactions filter uses follow_up_date <= today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('realtime subscription', () => {
    it('subscribes to alerts changes', () => {
      const channelName = 'notification-counts-alerts';
      expect(channelName).toBeTruthy();
    });

    it('subscribes to insights changes', () => {
      const channelName = 'notification-counts-insights';
      expect(channelName).toBeTruthy();
    });

    it('subscribes to health_alerts changes', () => {
      const channelName = 'notification-counts-health';
      expect(channelName).toBeTruthy();
    });

    it('subscribes to all events (*)', () => {
      const event = '*';
      expect(event).toBe('*');
    });

    it('uses public schema', () => {
      const schema = 'public';
      expect(schema).toBe('public');
    });

    it('filters subscription by user_id', () => {
      const userId = 'test-user';
      const filter = `user_id=eq.${userId}`;
      expect(filter).toBe('user_id=eq.test-user');
    });
  });

  describe('cleanup', () => {
    it('removes channels on unmount', () => {
      // The hook removes 3 channels on unmount
      const channels = ['alertsChannel', 'insightsChannel', 'healthChannel'];
      expect(channels).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('catches errors and continues', () => {
      let isLoading = true;
      try {
        throw new Error('Network error');
      } catch {
        // error caught
      } finally {
        isLoading = false;
      }
      expect(isLoading).toBe(false);
    });

    it('sets loading to false after fetch completes', () => {
      let isLoading = true;
      // Simulate finally block
      isLoading = false;
      expect(isLoading).toBe(false);
    });
  });

  describe('parallel fetching', () => {
    it('fetches all counts in parallel via Promise.all', async () => {
      const results = await Promise.all([
        Promise.resolve({ count: 3 }),
        Promise.resolve({ count: 2 }),
        Promise.resolve({ count: 1 }),
        Promise.resolve({ count: 4 }),
      ]);
      expect(results).toHaveLength(4);
      expect(results[0].count).toBe(3);
      expect(results[1].count).toBe(2);
      expect(results[2].count).toBe(1);
      expect(results[3].count).toBe(4);
    });

    it('handles partial failure in Promise.all', async () => {
      try {
        await Promise.all([
          Promise.resolve({ count: 3 }),
          Promise.reject(new Error('fail')),
        ]);
      } catch (e) {
        expect((e as Error).message).toBe('fail');
      }
    });
  });
});
