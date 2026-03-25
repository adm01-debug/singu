import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStakeholderSimulator } from '../useStakeholderSimulator';
import type { StakeholderData } from '../useStakeholderAnalysis';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const makeStakeholder = (id: string, support: number, power = 5, engagement = 5): StakeholderData => ({
  contact: {
    id,
    user_id: 'u1',
    first_name: 'User',
    last_name: id,
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
  metrics: { power, interest: 5, influence: 5, support, engagement },
  quadrant: 'monitor',
  strategyRecommendation: '',
  riskLevel: 'low',
  priority: 50,
});

describe('useStakeholderSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial empty state', () => {
    const { result } = renderHook(() => useStakeholderSimulator([]));
    expect(result.current.changes).toEqual([]);
    expect(result.current.savedScenarios).toEqual([]);
    expect(result.current.simulationResult).toBeNull();
  });

  it('should export all functions', () => {
    const { result } = renderHook(() => useStakeholderSimulator([]));
    expect(typeof result.current.addChange).toBe('function');
    expect(typeof result.current.removeChange).toBe('function');
    expect(typeof result.current.clearChanges).toBe('function');
    expect(typeof result.current.applyPreset).toBe('function');
    expect(typeof result.current.saveScenario).toBe('function');
    expect(typeof result.current.loadScenario).toBe('function');
    expect(typeof result.current.deleteScenario).toBe('function');
  });

  it('should add a change', () => {
    const stakeholders = [makeStakeholder('c1', -3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.addChange({
        contactId: 'c1',
        contactName: 'User c1',
        originalMetrics: stakeholders[0].metrics,
        newMetrics: { support: 0 },
        action: 'neutralize',
        description: 'Neutralize blocker',
      });
    });
    expect(result.current.changes.length).toBe(1);
  });

  it('should compute simulation result when changes exist', () => {
    const stakeholders = [makeStakeholder('c1', -3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.addChange({
        contactId: 'c1',
        contactName: 'User c1',
        originalMetrics: stakeholders[0].metrics,
        newMetrics: { support: 0 },
        action: 'neutralize',
        description: 'test',
      });
    });
    expect(result.current.simulationResult).not.toBeNull();
    expect(result.current.simulationResult!.successProbability).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(result.current.simulationResult!.effortRequired);
  });

  it('should clear changes', () => {
    const stakeholders = [makeStakeholder('c1', -3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.addChange({
        contactId: 'c1',
        contactName: 'User c1',
        originalMetrics: stakeholders[0].metrics,
        newMetrics: { support: 0 },
        action: 'neutralize',
        description: 'test',
      });
    });
    act(() => {
      result.current.clearChanges();
    });
    expect(result.current.changes).toEqual([]);
    expect(result.current.simulationResult).toBeNull();
  });

  it('should apply convert_blockers preset', () => {
    const stakeholders = [makeStakeholder('c1', -3), makeStakeholder('c2', 3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.applyPreset('convert_blockers');
    });
    expect(result.current.changes.length).toBe(1); // Only c1 is blocker
    expect(result.current.changes[0].action).toBe('neutralize');
  });

  it('should apply boost_champions preset', () => {
    const stakeholders = [makeStakeholder('c1', 3), makeStakeholder('c2', -3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.applyPreset('boost_champions');
    });
    expect(result.current.changes.length).toBe(1); // Only c1 qualifies (support 2-4)
    expect(result.current.changes[0].action).toBe('boost');
  });

  it('should apply convert_neutrals preset', () => {
    const stakeholders = [makeStakeholder('c1', 0), makeStakeholder('c2', 1)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.applyPreset('convert_neutrals');
    });
    expect(result.current.changes.length).toBe(2);
    expect(result.current.changes[0].action).toBe('convert');
  });

  it('should save and load scenario', () => {
    const { result } = renderHook(() => useStakeholderSimulator([]));
    act(() => {
      result.current.saveScenario('Test', 'A test scenario');
    });
    expect(result.current.savedScenarios.length).toBe(1);
    expect(result.current.savedScenarios[0].name).toBe('Test');
  });

  it('should delete scenario', () => {
    const { result } = renderHook(() => useStakeholderSimulator([]));
    let scenarioId: string;
    act(() => {
      const s = result.current.saveScenario('Test', 'desc');
      scenarioId = s.id;
    });
    act(() => {
      result.current.deleteScenario(scenarioId!);
    });
    expect(result.current.savedScenarios.length).toBe(0);
  });

  it('should remove a specific change', () => {
    const stakeholders = [makeStakeholder('c1', -3), makeStakeholder('c2', -3)];
    const { result } = renderHook(() => useStakeholderSimulator(stakeholders));
    act(() => {
      result.current.applyPreset('convert_blockers');
    });
    act(() => {
      result.current.removeChange('c1');
    });
    expect(result.current.changes.length).toBe(1);
    expect(result.current.changes[0].contactId).toBe('c2');
  });
});
