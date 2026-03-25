import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNetworkGraph } from '../useNetworkGraph';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'companies') {
        return {
          select: vi.fn().mockResolvedValue({ data: [{ id: 'comp1', name: 'Acme', industry: 'Tech', logo_url: null }], error: null }),
        };
      }
      if (table === 'contacts') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'c1', first_name: 'John', last_name: 'Doe', company_id: 'comp1', relationship_score: 80, role: 'manager', avatar_url: null },
              { id: 'c2', first_name: 'Jane', last_name: 'Smith', company_id: 'comp1', relationship_score: 30, role: 'contact', avatar_url: null },
            ],
            error: null,
          }),
        };
      }
      if (table === 'interactions') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'i1', contact_id: 'c1', company_id: 'comp1', created_at: '2024-01-01' },
              { id: 'i2', contact_id: 'c1', company_id: 'comp1', created_at: '2024-01-02' },
              { id: 'i3', contact_id: 'c2', company_id: 'comp1', created_at: '2024-01-03' },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

describe('useNetworkGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useNetworkGraph());
    expect(result.current.graphData.nodes).toEqual([]);
    expect(result.current.graphData.links).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedNode).toBeNull();
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useNetworkGraph());
    expect(typeof result.current.setSelectedNode).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should compute initial stats', () => {
    const { result } = renderHook(() => useNetworkGraph());
    expect(result.current.stats.totalNodes).toBe(0);
    expect(result.current.stats.totalLinks).toBe(0);
    expect(result.current.stats.avgConnections).toBe(0);
    expect(result.current.stats.clusters).toBeGreaterThanOrEqual(1);
  });

  it('should resolve loading after fetch', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should build graph nodes after fetch', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Should have: 1 "you" + 1 company + 2 contacts = 4 nodes
    expect(result.current.graphData.nodes.length).toBe(4);
  });

  it('should include you node', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    const youNode = result.current.graphData.nodes.find(n => n.type === 'you');
    expect(youNode).toBeDefined();
    expect(youNode!.name).toBe('Você');
  });

  it('should build links between contacts and companies', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    const worksAtLinks = result.current.graphData.links.filter(l => l.type === 'works_at');
    expect(worksAtLinks.length).toBe(2); // c1 and c2 both work at comp1
  });

  it('should build interacted links from you to contacts', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    const interactedLinks = result.current.graphData.links.filter(l => l.type === 'interacted');
    expect(interactedLinks.length).toBe(2); // you -> c1, you -> c2
  });

  it('should build connected links between contacts in same company', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    const connectedLinks = result.current.graphData.links.filter(l => l.type === 'connected');
    expect(connectedLinks.length).toBe(1); // c1 <-> c2
  });

  it('should compute stats with top influencers', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.stats.totalNodes).toBeGreaterThan(0);
    expect(result.current.stats.totalLinks).toBeGreaterThan(0);
    expect(result.current.stats.topInfluencers.length).toBeGreaterThan(0);
  });

  it('should assign colors based on relationship score', async () => {
    const { result } = renderHook(() => useNetworkGraph());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    const highNode = result.current.graphData.nodes.find(n => n.name === 'John Doe');
    const lowNode = result.current.graphData.nodes.find(n => n.name === 'Jane Smith');
    expect(highNode!.color).toBe('#22c55e'); // green for score 80
    expect(lowNode!.color).toBe('#ef4444'); // red for score 30
  });
});
