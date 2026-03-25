import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCoalitionDetection } from '../useCoalitionDetection';
import type { StakeholderData } from '../useStakeholderAnalysis';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const makeStakeholder = (overrides: Partial<StakeholderData> & { id?: string } = {}): StakeholderData => ({
  contact: {
    id: overrides.id || 'c1',
    user_id: 'u1',
    first_name: 'John',
    last_name: 'Doe',
    email: null,
    phone: null,
    company_id: null,
    role: 'contact',
    relationship_score: 50,
    relationship_stage: 'prospect',
    sentiment: 'neutral',
    behavior: null,
    avatar_url: null,
    notes: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  } as any,
  metrics: {
    power: 5,
    interest: 5,
    influence: 5,
    support: 0,
    engagement: 5,
    ...(overrides.metrics || {}),
  },
  quadrant: overrides.quadrant || 'monitor',
  strategyRecommendation: '',
  riskLevel: overrides.riskLevel || 'low',
  priority: overrides.priority || 50,
});

describe('useCoalitionDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty analysis for no stakeholders', () => {
    const { result } = renderHook(() => useCoalitionDetection([]));
    expect(result.current.coalitions).toEqual([]);
    expect(result.current.influenceClusters).toEqual([]);
    expect(result.current.powerBalance.balance).toBe('contested');
    expect(result.current.keyConnections).toEqual([]);
    expect(result.current.insights.length).toBeGreaterThan(0);
  });

  it('should detect support coalition when enough supporters exist', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 7, interest: 7, influence: 7, support: 4, engagement: 7 } }),
      makeStakeholder({ id: 'c2', metrics: { power: 6, interest: 6, influence: 6, support: 3, engagement: 6 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    const supportCoalition = result.current.coalitions.find(c => c.type === 'support');
    expect(supportCoalition).toBeDefined();
    expect(supportCoalition!.members.length).toBe(2);
  });

  it('should detect opposition coalition when blockers exist', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 7, interest: 5, influence: 6, support: -4, engagement: 3 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    const opposition = result.current.coalitions.find(c => c.type === 'opposition');
    expect(opposition).toBeDefined();
  });

  it('should calculate power balance', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 8, interest: 8, influence: 8, support: 4, engagement: 8 } }),
      makeStakeholder({ id: 'c2', metrics: { power: 3, interest: 3, influence: 3, support: -3, engagement: 3 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    expect(result.current.powerBalance.supportPower).toBeGreaterThan(0);
    expect(result.current.powerBalance.oppositionPower).toBeGreaterThan(0);
    expect(['favorable', 'unfavorable', 'contested']).toContain(result.current.powerBalance.balance);
  });

  it('should return favorable balance when support dominates', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 9, interest: 9, influence: 9, support: 5, engagement: 9 } }),
      makeStakeholder({ id: 'c2', metrics: { power: 8, interest: 8, influence: 8, support: 4, engagement: 8 } }),
      makeStakeholder({ id: 'c3', metrics: { power: 2, interest: 2, influence: 2, support: -3, engagement: 2 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    expect(result.current.powerBalance.balance).toBe('favorable');
  });

  it('should generate insights', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 7, interest: 7, influence: 7, support: 4, engagement: 7 } }),
      makeStakeholder({ id: 'c2', metrics: { power: 6, interest: 6, influence: 6, support: 3, engagement: 6 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    expect(Array.isArray(result.current.insights)).toBe(true);
  });

  it('should have recommendation in power balance', () => {
    const { result } = renderHook(() => useCoalitionDetection([]));
    expect(typeof result.current.powerBalance.recommendation).toBe('string');
    expect(result.current.powerBalance.recommendation.length).toBeGreaterThan(0);
  });

  it('should assign coalition risk levels', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 9, interest: 5, influence: 8, support: -4, engagement: 3 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    const opposition = result.current.coalitions.find(c => c.type === 'opposition');
    if (opposition) {
      expect(['low', 'medium', 'high']).toContain(opposition.risk);
    }
  });

  it('should detect key connections for similar stakeholders', () => {
    const stakeholders = [
      makeStakeholder({ id: 'c1', metrics: { power: 7, interest: 7, influence: 7, support: 4, engagement: 7 } }),
      makeStakeholder({ id: 'c2', metrics: { power: 7, interest: 7, influence: 7, support: 4, engagement: 7 } }),
    ];
    const { result } = renderHook(() => useCoalitionDetection(stakeholders));
    expect(result.current.keyConnections.length).toBeGreaterThan(0);
  });
});
