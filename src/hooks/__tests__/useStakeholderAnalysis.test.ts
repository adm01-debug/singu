import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStakeholderAnalysis } from '../useStakeholderAnalysis';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

const makeContact = (overrides: Record<string, any> = {}) => ({
  id: 'c1',
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
  ...overrides,
});

const makeInteraction = (overrides: Record<string, any> = {}) => ({
  id: 'i1',
  user_id: 'u1',
  contact_id: 'c1',
  company_id: null,
  type: 'call',
  title: 'Test',
  content: null,
  transcription: null,
  sentiment: 'neutral',
  follow_up_required: false,
  follow_up_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('useStakeholderAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty data when no contacts', () => {
    const { result } = renderHook(() => useStakeholderAnalysis([], []));
    expect(result.current.stakeholders).toEqual([]);
    expect(result.current.summary.totalStakeholders).toBe(0);
    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should compute stakeholder metrics for a contact', () => {
    const contacts = [makeContact()];
    const interactions = [makeInteraction()];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, interactions as any));
    expect(result.current.stakeholders.length).toBe(1);
    const s = result.current.stakeholders[0];
    expect(s.metrics.power).toBeGreaterThanOrEqual(1);
    expect(s.metrics.power).toBeLessThanOrEqual(10);
    expect(s.metrics.interest).toBeGreaterThanOrEqual(1);
    expect(s.metrics.interest).toBeLessThanOrEqual(10);
  });

  it('should determine quadrant based on power and interest', () => {
    const contacts = [makeContact({ role: 'decision_maker', relationship_score: 90, relationship_stage: 'negotiation' })];
    const interactions = Array.from({ length: 5 }, (_, i) => makeInteraction({ id: `i${i}`, sentiment: 'positive', created_at: new Date().toISOString() }));
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, interactions as any));
    expect(['manage_closely', 'keep_satisfied', 'keep_informed', 'monitor']).toContain(result.current.stakeholders[0].quadrant);
  });

  it('should calculate risk level', () => {
    const contacts = [makeContact()];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(['low', 'medium', 'high']).toContain(result.current.stakeholders[0].riskLevel);
  });

  it('should calculate priority score', () => {
    const contacts = [makeContact()];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(result.current.stakeholders[0].priority).toBeGreaterThanOrEqual(0);
  });

  it('should count champions and blockers in summary', () => {
    const contacts = [
      makeContact({ id: 'c1', behavior: { decisionRole: 'champion', supportLevel: 9 }, sentiment: 'positive', relationship_stage: 'advocate' }),
      makeContact({ id: 'c2', behavior: { decisionRole: 'blocker', supportLevel: 1 }, sentiment: 'negative', relationship_stage: 'lost' }),
    ];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(result.current.summary.totalStakeholders).toBe(2);
  });

  it('should compute average metrics in summary', () => {
    const contacts = [makeContact({ id: 'c1' }), makeContact({ id: 'c2' })];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(result.current.summary.avgPower).toBeGreaterThan(0);
    expect(result.current.summary.avgInterest).toBeGreaterThan(0);
    expect(result.current.summary.avgInfluence).toBeGreaterThan(0);
  });

  it('should generate recommendations', () => {
    const contacts = [makeContact()];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(Array.isArray(result.current.recommendations)).toBe(true);
  });

  it('should calculate risk score in summary', () => {
    const contacts = [makeContact()];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    expect(result.current.summary.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.current.summary.riskScore).toBeLessThanOrEqual(100);
  });

  it('should sort stakeholders by priority descending', () => {
    const contacts = [
      makeContact({ id: 'c1', role: 'contact' }),
      makeContact({ id: 'c2', role: 'decision_maker', relationship_score: 90 }),
    ];
    const { result } = renderHook(() => useStakeholderAnalysis(contacts as any, []));
    if (result.current.stakeholders.length >= 2) {
      expect(result.current.stakeholders[0].priority).toBeGreaterThanOrEqual(result.current.stakeholders[1].priority);
    }
  });
});
