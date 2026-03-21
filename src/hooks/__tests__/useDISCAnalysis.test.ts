import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDISCAnalysis } from '../useDISCAnalysis';

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
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/data/discAdvancedData', () => ({
  DISC_PROFILES: {
    D: { name: 'Dominante', shortDescription: 'Direto', salesApproach: { presentation: ['Be direct', 'Show results'] } },
    I: { name: 'Influente', shortDescription: 'Entusiasta', salesApproach: { presentation: ['Tell stories', 'Be enthusiastic'] } },
    S: { name: 'Estável', shortDescription: 'Paciente', salesApproach: { presentation: ['Be patient', 'Show stability'] } },
    C: { name: 'Consciente', shortDescription: 'Analítico', salesApproach: { presentation: ['Provide data', 'Be precise'] } },
  },
  DISC_DETECTION_PATTERNS: [
    { profile: 'D', patterns: [/\b(resultado|rápido|direto|meta)\b/gi], phrases: ['vamos ao ponto'], weight: 2 },
    { profile: 'I', patterns: [/\b(equipe|juntos|divertido|social)\b/gi], phrases: ['vamos celebrar'], weight: 2 },
    { profile: 'S', patterns: [/\b(estabilidade|segurança|calma|confiança)\b/gi], phrases: ['não tenha pressa'], weight: 2 },
    { profile: 'C', patterns: [/\b(dados|análise|precisão|qualidade)\b/gi], phrases: ['me mostre os números'], weight: 2 },
  ],
  calculateBlendCode: vi.fn().mockReturnValue({ primary: 'D', secondary: 'I', blend: 'DI' }),
  getProfileInfo: vi.fn().mockReturnValue({ name: 'Dominante' }),
  getBlendProfile: vi.fn().mockReturnValue(null),
  getCompatibility: vi.fn().mockReturnValue({ score: 70 }),
}));
vi.mock('@/lib/contact-utils', () => ({
  getContactBehavior: vi.fn().mockReturnValue(null),
}));

describe('useDISCAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    expect(result.current.analyzing).toBe(false);
    expect(result.current.latestAnalysis).toBeNull();
    expect(result.current.analysisHistory).toEqual([]);
    expect(result.current.dashboardData).toBeNull();
  });

  it('should export all required functions', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    expect(typeof result.current.analyzeText).toBe('function');
    expect(typeof result.current.analyzeContact).toBe('function');
    expect(typeof result.current.fetchAnalysisHistory).toBe('function');
    expect(typeof result.current.fetchLatestAnalysis).toBe('function');
    expect(typeof result.current.saveManualProfile).toBe('function');
    expect(typeof result.current.fetchDashboardData).toBe('function');
  });

  it('should export utility functions', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    expect(typeof result.current.detectProfileFromText).toBe('function');
    expect(typeof result.current.getProfileInfo).toBe('function');
    expect(typeof result.current.getBlendProfile).toBe('function');
    expect(typeof result.current.getCompatibility).toBe('function');
  });

  it('should detect D profile keywords from text', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const detection = result.current.detectProfileFromText('Quero resultado rápido e direto');
    expect(detection.scores).toBeDefined();
    expect(detection.keywords.length).toBeGreaterThan(0);
    expect(detection.confidence).toBeGreaterThan(0);
  });

  it('should detect I profile keywords from text', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const detection = result.current.detectProfileFromText('Vamos trabalhar juntos na equipe, vai ser divertido!');
    expect(detection.keywords.length).toBeGreaterThan(0);
  });

  it('should normalize scores to 0-100', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const detection = result.current.detectProfileFromText('resultado rápido direto meta análise dados');
    expect(detection.scores.D).toBeLessThanOrEqual(100);
    expect(detection.scores.I).toBeLessThanOrEqual(100);
    expect(detection.scores.S).toBeLessThanOrEqual(100);
    expect(detection.scores.C).toBeLessThanOrEqual(100);
  });

  it('should return zero scores for empty text', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const detection = result.current.detectProfileFromText('');
    expect(detection.scores.D).toBe(0);
    expect(detection.scores.I).toBe(0);
    expect(detection.scores.S).toBe(0);
    expect(detection.scores.C).toBe(0);
    expect(detection.confidence).toBe(20); // min confidence
  });

  it('should calculate confidence based on total evidence', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const lowEvidence = result.current.detectProfileFromText('resultado');
    const highEvidence = result.current.detectProfileFromText('resultado rápido direto meta equipe juntos divertido social');
    expect(highEvidence.confidence).toBeGreaterThan(lowEvidence.confidence);
  });

  it('should detect phrase matches', () => {
    const { result } = renderHook(() => useDISCAnalysis('contact-1'));
    const detection = result.current.detectProfileFromText('vamos ao ponto');
    expect(detection.phrases.length).toBeGreaterThan(0);
  });

  it('should return null when analyzeText called without contactId', async () => {
    const { result } = renderHook(() => useDISCAnalysis());
    const record = await result.current.analyzeText(['test text']);
    expect(record).toBeNull();
  });
});
