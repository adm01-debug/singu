import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmotionalStates } from '../useEmotionalStates';

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
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/data/nlpAdvancedData', () => ({
  EMOTIONAL_STATE_KEYWORDS: {
    excited: ['empolgado', 'animado', 'entusiasmado'],
    interested: ['interessado', 'curioso', 'intrigado'],
    confident: ['confiante', 'seguro', 'certo'],
    hopeful: ['esperança', 'otimista'],
    neutral: ['normal', 'ok'],
    hesitant: ['hesitante', 'indeciso'],
    skeptical: ['cético', 'desconfiado'],
    frustrated: ['frustrado', 'irritado'],
    anxious: ['ansioso', 'preocupado'],
    resistant: ['resistente', 'contra'],
    curious: ['curioso'],
  },
  EMOTIONAL_STATE_INFO: {
    excited: { name: 'Empolgado' },
    interested: { name: 'Interessado' },
    confident: { name: 'Confiante' },
    hopeful: { name: 'Esperançoso' },
    neutral: { name: 'Neutro' },
    hesitant: { name: 'Hesitante' },
    skeptical: { name: 'Cético' },
    frustrated: { name: 'Frustrado' },
    anxious: { name: 'Ansioso' },
    resistant: { name: 'Resistente' },
    curious: { name: 'Curioso' },
  },
}));
vi.mock('@/types/nlp-advanced', () => ({}));

describe('useEmotionalStates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useEmotionalStates());
    expect(result.current.analyzing).toBe(false);
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useEmotionalStates());
    expect(typeof result.current.detectEmotionalState).toBe('function');
    expect(typeof result.current.extractAnchors).toBe('function');
    expect(typeof result.current.analyzeEmotionalHistory).toBe('function');
    expect(result.current.EMOTIONAL_STATE_INFO).toBeDefined();
  });

  it('should detect excited state', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const res = result.current.detectEmotionalState('Estou muito empolgado e animado com isso!');
    expect(res.state).toBe('excited');
    expect(res.confidence).toBeGreaterThan(0);
    expect(res.matchedWords.length).toBeGreaterThan(0);
  });

  it('should detect frustrated state', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const res = result.current.detectEmotionalState('Estou frustrado e irritado com esse processo');
    expect(res.state).toBe('frustrated');
  });

  it('should return neutral for empty text', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const res = result.current.detectEmotionalState('');
    expect(res.state).toBe('neutral');
    expect(res.confidence).toBe(0);
  });

  it('should cap confidence at 100', () => {
    const { result } = renderHook(() => useEmotionalStates());
    // With formula confidence = min(100, maxScore * 25), 4+ matches would cap
    const res = result.current.detectEmotionalState('empolgado animado entusiasmado empolgado animado');
    expect(res.confidence).toBeLessThanOrEqual(100);
  });

  it('should extract positive and negative anchors from interactions', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const interactions = [
      { id: '1', content: 'Estou muito empolgado com essa proposta incrível e animado com o resultado.', createdAt: '2024-01-01' },
      { id: '2', content: 'Estou frustrado com os problemas recorrentes que temos enfrentado.', createdAt: '2024-01-02' },
    ];
    const { positive, negative } = result.current.extractAnchors(interactions);
    expect(Array.isArray(positive)).toBe(true);
    expect(Array.isArray(negative)).toBe(true);
  });

  it('should analyze emotional history', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const interactions = [
      { id: '1', content: 'Estou empolgado', createdAt: '2024-01-01' },
      { id: '2', content: 'Estou animado', createdAt: '2024-01-02' },
      { id: '3', content: 'Estou entusiasmado', createdAt: '2024-01-03' },
    ];
    const analysis = result.current.analyzeEmotionalHistory(interactions);
    expect(analysis.currentState).toBeDefined();
    expect(analysis.stateHistory).toBeDefined();
    expect(analysis.emotionalTrend).toBeDefined();
    expect(analysis.bestMomentToClose).toBeDefined();
  });

  it('should return stable trend with insufficient history', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const analysis = result.current.analyzeEmotionalHistory([
      { id: '1', content: 'ok', createdAt: '2024-01-01' },
    ]);
    expect(analysis.emotionalTrend).toBe('stable');
  });

  it('should return bestMomentToClose with recommendation', () => {
    const { result } = renderHook(() => useEmotionalStates());
    const analysis = result.current.analyzeEmotionalHistory([
      { id: '1', content: 'Estou empolgado e confiante', createdAt: '2024-01-01' },
    ]);
    expect(analysis.bestMomentToClose.recommended).toBeDefined();
    expect(typeof analysis.bestMomentToClose.reason).toBe('string');
    expect(typeof analysis.bestMomentToClose.optimalTiming).toBe('string');
  });
});
