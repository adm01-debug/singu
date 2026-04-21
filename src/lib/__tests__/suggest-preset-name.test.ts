import { describe, it, expect } from 'vitest';
import {
  suggestInteracoesPresetName,
  suggestGenericPresetName,
  formatDateRange,
  formatToday,
} from '../suggestPresetName';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

const NOW = new Date('2025-04-21T12:00:00Z');

function baseFilters(over: Partial<AdvancedFilters> = {}): AdvancedFilters {
  return {
    q: '',
    contact: '',
    company: '',
    canais: [],
    direcao: 'all',
    de: undefined,
    ate: undefined,
    sort: 'recent',
    ...over,
  };
}

describe('suggestInteracoesPresetName', () => {
  it('retorna fallback "Busca DD/MM" quando não há filtros', () => {
    const out = suggestInteracoesPresetName(baseFilters(), NOW);
    expect(out).toBe(`Busca ${formatToday(NOW)}`);
  });

  it('combina empresa + canal único', () => {
    const out = suggestInteracoesPresetName(
      baseFilters({ company: 'Acme', canais: ['whatsapp'] }),
      NOW,
    );
    expect(out).toBe('Acme · WhatsApp');
  });

  it('formata "últimos 30d" quando intervalo bate', () => {
    const ate = new Date(NOW);
    const de = new Date(NOW);
    de.setDate(de.getDate() - 30);
    const out = suggestInteracoesPresetName(baseFilters({ de, ate }), NOW);
    expect(out).toContain('últimos 30d');
  });

  it('formata "últimos 7d" quando intervalo bate', () => {
    const ate = new Date(NOW);
    const de = new Date(NOW);
    de.setDate(de.getDate() - 7);
    const out = suggestInteracoesPresetName(baseFilters({ de, ate }), NOW);
    expect(out).toContain('últimos 7d');
  });

  it('prioriza termo de busca q com aspas', () => {
    const out = suggestInteracoesPresetName(
      baseFilters({ q: 'proposta', company: 'Acme' }),
      NOW,
    );
    expect(out).toBe('"proposta" · Acme');
  });

  it('agrega quando há 3+ canais', () => {
    const out = suggestInteracoesPresetName(
      baseFilters({ canais: ['whatsapp', 'email', 'call'] }),
      NOW,
    );
    expect(out).toContain('3 canais');
  });

  it('combina 2 canais com "+"', () => {
    const out = suggestInteracoesPresetName(
      baseFilters({ canais: ['whatsapp', 'email'] }),
      NOW,
    );
    expect(out).toContain('WhatsApp+Email');
  });

  it('inclui direção quando não-default', () => {
    const out = suggestInteracoesPresetName(baseFilters({ direcao: 'inbound' }), NOW);
    expect(out).toContain('recebidas');
  });

  it('trunca em 60 caracteres', () => {
    const out = suggestInteracoesPresetName(
      baseFilters({
        q: 'a'.repeat(30),
        company: 'b'.repeat(30),
        canais: ['whatsapp', 'email', 'call'],
      }),
      NOW,
    );
    expect(out.length).toBeLessThanOrEqual(60);
  });

  it('formata mês inteiro como "abr/25"', () => {
    const de = new Date('2025-04-01T12:00:00Z');
    const ate = new Date('2025-04-30T12:00:00Z');
    const out = formatDateRange(de, ate, NOW);
    expect(out).toBe('abr/25');
  });

  it('formata intervalo arbitrário com "→"', () => {
    const de = new Date('2025-04-01T12:00:00Z');
    const ate = new Date('2025-04-15T12:00:00Z');
    const out = formatDateRange(de, ate, NOW);
    expect(out).toBe('01/04 → 15/04');
  });
});

describe('suggestGenericPresetName', () => {
  it('retorna fallback sem filtros', () => {
    const out = suggestGenericPresetName({}, undefined, NOW);
    expect(out).toBe(`Busca ${formatToday(NOW)}`);
  });

  it('mostra "N chave" quando há múltiplos valores', () => {
    const out = suggestGenericPresetName({ cargo: ['CEO', 'CTO'] }, undefined, NOW);
    expect(out).toBe('2 cargo');
  });

  it('usa valor único diretamente', () => {
    const out = suggestGenericPresetName({ cidade: ['Curitiba'] }, undefined, NOW);
    expect(out).toBe('Curitiba');
  });

  it('inclui termo de busca com aspas', () => {
    const out = suggestGenericPresetName({ cargo: ['CEO'] }, 'silva', NOW);
    expect(out).toBe('"silva" · CEO');
  });
});
