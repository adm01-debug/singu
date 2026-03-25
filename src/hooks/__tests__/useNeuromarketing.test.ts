import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNeuromarketing } from '../useNeuromarketing';

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
vi.mock('@/types/neuromarketing', () => ({}));
vi.mock('@/data/neuromarketingData', () => ({
  BRAIN_SYSTEM_INFO: {
    reptilian: { namePt: 'Reptiliano' },
    limbic: { namePt: 'Límbico' },
    neocortex: { namePt: 'Neocórtex' },
  },
  PRIMAL_STIMULUS_INFO: {
    self_centered: { namePt: 'Autocentrado' },
    contrast: { namePt: 'Contraste' },
    tangible: { namePt: 'Tangível' },
    memorable: { namePt: 'Memorável' },
    visual: { namePt: 'Visual' },
    emotional: { namePt: 'Emocional' },
  },
  NEUROCHEMICAL_INFO: {
    dopamine: { name: 'Dopamine' },
    cortisol: { name: 'Cortisol' },
    oxytocin: { name: 'Oxytocin' },
    serotonin: { name: 'Serotonin' },
  },
  TRIGGER_BRAIN_MAPPING: {},
  BIAS_BRAIN_MAPPING: {},
  DISC_BRAIN_CORRELATION: {
    D: { primaryBrain: 'reptilian', secondaryBrain: 'neocortex', responsiveStimuli: ['contrast', 'tangible'], dominantNeurochemical: 'cortisol' },
    I: { primaryBrain: 'limbic', secondaryBrain: 'reptilian', responsiveStimuli: ['emotional', 'memorable'], dominantNeurochemical: 'dopamine' },
    S: { primaryBrain: 'limbic', secondaryBrain: 'neocortex', responsiveStimuli: ['emotional', 'self_centered'], dominantNeurochemical: 'oxytocin' },
    C: { primaryBrain: 'neocortex', secondaryBrain: 'limbic', responsiveStimuli: ['tangible', 'contrast'], dominantNeurochemical: 'serotonin' },
  },
  PAIN_KEYWORDS: {
    high_intensity: ['frustrado', 'insatisfeito', 'problema grave'],
    medium_intensity: ['preocupado', 'dificuldade', 'desafio'],
  },
  GAIN_KEYWORDS: [],
}));

describe('useNeuromarketing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export all analysis functions', () => {
    const { result } = renderHook(() => useNeuromarketing());
    expect(typeof result.current.analyzeText).toBe('function');
    expect(typeof result.current.analyzeBrainSystem).toBe('function');
    expect(typeof result.current.analyzeStimuliResponse).toBe('function');
    expect(typeof result.current.detectPainPoints).toBe('function');
    expect(typeof result.current.generateNeuroProfileFromDISC).toBe('function');
    expect(typeof result.current.calculateNeuroCompatibility).toBe('function');
  });

  it('should export info getter functions', () => {
    const { result } = renderHook(() => useNeuromarketing());
    expect(typeof result.current.getBrainSystemInfo).toBe('function');
    expect(typeof result.current.getStimulusInfo).toBe('function');
    expect(typeof result.current.getNeurochemicalInfo).toBe('function');
    expect(typeof result.current.getTriggerNeuroMapping).toBe('function');
    expect(typeof result.current.getBiasNeuroMapping).toBe('function');
  });

  it('should export static data', () => {
    const { result } = renderHook(() => useNeuromarketing());
    expect(result.current.BRAIN_SYSTEM_INFO).toBeDefined();
    expect(result.current.PRIMAL_STIMULUS_INFO).toBeDefined();
    expect(result.current.NEUROCHEMICAL_INFO).toBeDefined();
    expect(result.current.DISC_BRAIN_CORRELATION).toBeDefined();
  });

  it('should analyze brain system from text', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const scores = result.current.analyzeBrainSystem('Preciso agir urgente, risco de perder');
    expect(scores.reptilian).toBeGreaterThan(0);
    expect(scores.reptilian + scores.limbic + scores.neocortex).toBeCloseTo(100, -1);
  });

  it('should detect limbic brain system', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const scores = result.current.analyzeBrainSystem('Sinto confiança no relacionamento e conexão com a equipe');
    expect(scores.limbic).toBeGreaterThan(0);
  });

  it('should detect neocortex brain system', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const scores = result.current.analyzeBrainSystem('Preciso da análise dos dados e estatística do processo');
    expect(scores.neocortex).toBeGreaterThan(0);
  });

  it('should analyze stimuli response from text', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const stimuli = result.current.analyzeStimuliResponse('Eu preciso ver isso para minha empresa, meu negócio');
    expect(Array.isArray(stimuli)).toBe(true);
  });

  it('should detect pain points', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const pains = result.current.detectPainPoints('Estou frustrado com esse problema grave');
    expect(pains.length).toBeGreaterThan(0);
    expect(pains[0].intensity).toBe(9);
  });

  it('should generate neuro profile from DISC', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const profile = result.current.generateNeuroProfileFromDISC('D');
    expect(profile.dominantBrain).toBe('reptilian');
    expect(profile.riskTolerance).toBe('high');
    expect(profile.decisionSpeed).toBe('impulsive');
  });

  it('should generate default profile for null DISC', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const profile = result.current.generateNeuroProfileFromDISC(null);
    expect(profile.dominantBrain).toBe('limbic');
    expect(profile.riskTolerance).toBe('medium');
    expect(profile.decisionSpeed).toBe('moderate');
  });

  it('should perform full text analysis', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const analysis = result.current.analyzeText('Preciso urgente da análise para minha empresa');
    expect(analysis.detectedBrainSystem).toBeDefined();
    expect(analysis.brainSystemScores).toBeDefined();
    expect(analysis.detectedStimuli).toBeDefined();
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should normalize brain scores to 100', () => {
    const { result } = renderHook(() => useNeuromarketing());
    const scores = result.current.analyzeBrainSystem('urgente medo risco perder segurança');
    const total = scores.reptilian + scores.limbic + scores.neocortex;
    expect(total).toBeCloseTo(100, -1);
  });

  it('should cap pain point results to 5', () => {
    const { result } = renderHook(() => useNeuromarketing());
    // Even with many matches, should cap at 5
    const pains = result.current.detectPainPoints('frustrado insatisfeito problema grave preocupado dificuldade desafio preocupado dificuldade');
    expect(pains.length).toBeLessThanOrEqual(5);
  });
});
