import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdvancedTriggers } from '../useAdvancedTriggers';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('./useTriggerHistory', () => ({
  useTriggerHistory: () => ({ history: [], loading: false, stats: null }),
}));
vi.mock('../useTriggerHistory', () => ({
  useTriggerHistory: () => ({ history: [], loading: false, stats: null }),
}));
vi.mock('@/types/triggers', () => ({
  TriggerType: {},
  MENTAL_TRIGGERS: {},
}));
vi.mock('@/types/triggers-advanced', () => ({}));
vi.mock('@/data/triggersAdvancedData', () => ({
  ADVANCED_MENTAL_TRIGGERS: {},
  VALIDATED_TRIGGER_CHAINS: [],
  TRIGGER_CONFLICTS: [],
  TRIGGER_SYNERGIES: [],
  NEUROCHEMICAL_TIMING: [
    { chemical: 'dopamine', optimalHours: [10, 11, 14], peakDays: ['tuesday', 'wednesday'], reasoning: 'test' },
  ],
  TRIGGER_FALLBACKS: [],
  INTENSITY_LEVELS: { 1: 'very_low', 2: 'low', 3: 'medium', 4: 'high', 5: 'very_high' },
}));

describe('useAdvancedTriggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null fullAnalysis when contact is null', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.fullAnalysis).toBeNull();
  });

  it('should export static data', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.advancedTriggers).toBeDefined();
    expect(result.current.triggerChains).toBeDefined();
    expect(result.current.intensityLevels).toBeDefined();
    expect(result.current.conflicts).toBeDefined();
    expect(result.current.synergies).toBeDefined();
    expect(result.current.neurochemicalTiming).toBeDefined();
    expect(result.current.fallbackTrees).toBeDefined();
  });

  it('should export analysis functions', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(typeof result.current.getOptimalTiming).toBe('function');
    expect(typeof result.current.detectConflicts).toBe('function');
    expect(typeof result.current.getSynergies).toBe('function');
    expect(typeof result.current.getFallbacks).toBe('function');
    expect(typeof result.current.getRecommendedIntensity).toBe('function');
  });

  it('should return empty exposure analysis with no history', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.exposureAnalysis).toEqual([]);
  });

  it('should return null resistance profile with no contact', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.resistanceProfile).toBeNull();
  });

  it('should have zero resistance score with no contact', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.resistanceScore).toBe(0);
  });

  it('should return default timing for unknown trigger', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    const timing = result.current.getOptimalTiming('unknown_trigger' as any);
    expect(timing.bestHours).toBeDefined();
    expect(timing.bestDays).toBeDefined();
    expect(timing.confidenceScore).toBeGreaterThan(0);
  });

  it('should detect no conflicts with empty array', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    const conflicts = result.current.detectConflicts([]);
    expect(conflicts).toEqual([]);
  });

  it('should return empty recommended chains with no contact', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    expect(result.current.recommendedChains).toEqual([]);
  });

  it('should return default intensity when no contact', () => {
    const { result } = renderHook(() => useAdvancedTriggers(null));
    const intensity = result.current.getRecommendedIntensity('scarcity' as any);
    expect(intensity).toBe(2);
  });
});
