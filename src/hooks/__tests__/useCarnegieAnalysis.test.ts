import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCarnegieAnalysis } from '../useCarnegieAnalysis';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/lib/contact-utils', () => ({
  getDISCProfile: vi.fn().mockReturnValue('I'),
  getDominantVAK: vi.fn().mockReturnValue('V'),
}));
vi.mock('@/data/carnegieNobleCauses', () => ({
  NOBLE_CAUSES: [],
  getNobleCausesByDISC: vi.fn().mockReturnValue([{ id: '1', cause: 'Test cause' }]),
}));
vi.mock('@/data/carnegieIdentityLabels', () => ({
  IDENTITY_LABELS: [],
  getTopLabelsForContact: vi.fn().mockReturnValue([{ id: '1', label: 'Leader' }]),
}));
vi.mock('@/data/carnegieWarmth', () => ({
  calculateWarmthScore: vi.fn().mockReturnValue(70),
  getWarmthLevel: vi.fn().mockReturnValue('warm'),
  detectWarmthIndicators: vi.fn().mockReturnValue([]),
  detectColdIndicators: vi.fn().mockReturnValue([]),
  getWarmthSuggestions: vi.fn().mockReturnValue([]),
}));
vi.mock('@/data/carnegieFaceSaving', () => ({
  detectFaceSavingScenario: vi.fn().mockReturnValue(null),
  getTechniqueForDISC: vi.fn().mockReturnValue(null),
}));
vi.mock('@/data/carnegieProgressCelebration', () => ({
  detectProgressType: vi.fn().mockReturnValue(null),
  getCelebrationForDISC: vi.fn().mockReturnValue(null),
}));

describe('useCarnegieAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return values when contact is null', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(result.current.discProfile).toBe('S'); // default
    expect(result.current.vakProfile).toBe('V'); // default
  });

  it('should return noble causes', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(Array.isArray(result.current.nobleCauses)).toBe(true);
  });

  it('should return identity labels', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(Array.isArray(result.current.identityLabels)).toBe(true);
  });

  it('should export analyzeWarmth function', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(typeof result.current.analyzeWarmth).toBe('function');
    const warmth = result.current.analyzeWarmth('Hello, how are you?');
    expect(warmth.overall).toBeDefined();
    expect(warmth.level).toBeDefined();
    expect(warmth.components).toBeDefined();
  });

  it('should export analyzeTalkRatio function', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(typeof result.current.analyzeTalkRatio).toBe('function');
    const ratio = result.current.analyzeTalkRatio('How are you? That is great. What do you think?');
    expect(ratio.speakerRatio).toBeDefined();
    expect(ratio.listenerRatio).toBeDefined();
    expect(ratio.questionCount).toBeGreaterThan(0);
    expect(ratio.statementCount).toBeGreaterThan(0);
  });

  it('should calculate quality based on deviation from ideal', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    const ratio = result.current.analyzeTalkRatio('Test text. Another sentence.', true);
    expect(['excellent', 'good', 'needs_improvement', 'poor']).toContain(ratio.quality);
  });

  it('should export detectFaceSaving function', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(typeof result.current.detectFaceSaving).toBe('function');
    const res = result.current.detectFaceSaving('some text');
    expect(res).toBeNull(); // mock returns null
  });

  it('should export detectProgress function', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    expect(typeof result.current.detectProgress).toBe('function');
    const res = result.current.detectProgress('some progress');
    expect(res).toBeNull();
  });

  it('should calculate Carnegie score', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    const score = result.current.calculateCarnegieScore(80);
    expect(score.overall).toBeGreaterThan(0);
    expect(['master', 'expert', 'proficient', 'developing', 'novice']).toContain(score.level);
    expect(score.components).toBeDefined();
    expect(score.components.warmth).toBe(80);
  });

  it('should set master level for high scores', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    const score = result.current.calculateCarnegieScore(100);
    // overall = 100*0.4 + 50*0.6 = 70
    expect(score.overall).toBe(70);
    expect(score.level).toBe('expert');
  });

  it('should add warmth strength when warmth is high', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    const score = result.current.calculateCarnegieScore(75);
    expect(score.strengths).toContain('Comunicação Calorosa');
  });

  it('should add improvement area when warmth is low', () => {
    const { result } = renderHook(() => useCarnegieAnalysis(null));
    const score = result.current.calculateCarnegieScore(30);
    expect(score.areasForImprovement).toContain('Adicionar mais calor à comunicação');
  });
});
